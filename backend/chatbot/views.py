import ipaddress
import json
import logging
import os
import re
import time
import uuid

from django.conf import settings
from django.core import signing
from django.http import JsonResponse, StreamingHttpResponse
from django.middleware.csrf import get_token
from django.views.decorators.cache import never_cache
from django.views.decorators.http import require_GET, require_POST

from . import config as cfg
from . import rag, store
from .safety import REFUSAL, private_request, redact, safe_answer

logger = logging.getLogger(__name__)
SALT = "pavelbot.visitor.v1"


def visitor(request):
    try:
        value = signing.loads(request.COOKIES.get(cfg.COOKIE, ""), salt=SALT, max_age=86400 * 30)
        return str(uuid.UUID(value))
    except (signing.BadSignature, ValueError, TypeError):
        return str(uuid.uuid4())


def ip_key(request):
    # Only trust a single-IP header if an origin-protecting proxy overwrites it.
    header = os.getenv("CHAT_TRUSTED_IP_HEADER", "")
    raw = request.META.get(header, "") if header else request.META.get("REMOTE_ADDR", "")
    try:
        address = ipaddress.ip_address(raw)
        value = str(ipaddress.ip_network(f"{address}/64", strict=False)) if address.version == 6 else str(address)
    except ValueError:
        value = "unknown"
    return store.identity(f"ip:{value}")


def failure(error):
    response = JsonResponse({"error": error.message}, status=error.status)
    if error.status in {429, 503}:
        response["Retry-After"] = str(error.retry_after)
    response["Cache-Control"] = "no-store"
    return response


def public_ready():
    if not os.getenv("OPENAI_API_KEY") or not os.getenv("DATABASE_URL"):
        return False
    with store.connect() as conn:
        return conn.execute("""SELECT EXISTS(SELECT 1 FROM pavelbot_public_chunks p JOIN knowledge_chunks k
            ON p.document_id=k.document_id AND p.chunk_index=k.chunk_index AND p.content_hash=k.content_hash
            WHERE p.is_public=true) AS ready""").fetchone()["ready"]


@never_cache
@require_GET
def session(request):
    value = visitor(request)
    messages, ready = [], False
    conversation_id = request.GET.get("conversation_id", "")
    try:
        ready = public_ready()
        if conversation_id:
            conversation_id = str(uuid.UUID(conversation_id))
            messages = store.conversation(store.identity(value), conversation_id)
    except store.ChatError as error:
        return failure(error)
    except ValueError:
        return failure(store.ChatError("Invalid conversation.", 400))
    except Exception:
        logger.warning("Pavel-bot session unavailable")
        ready = False
    response = JsonResponse({"csrf_token": get_token(request), "ready": ready, "messages": messages,
                             "max_question_chars": cfg.MAX_QUESTION_CHARS, "max_turns": cfg.MAX_TURNS})
    response.set_cookie(cfg.COOKIE, signing.dumps(value, salt=SALT), max_age=86400 * 30,
                        secure=not settings.DEBUG, httponly=True, samesite="Lax")
    return response


def event(name, data):
    return f"event: {name}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def stream_answer(question, history, conversation_id, request_id):
    started = time.monotonic()
    usage, answer, sources = {}, "", []
    usage_known, settled = False, False
    try:
        yield event("meta", {"conversation_id": conversation_id, "request_id": str(request_id)})
        if private_request(question):
            answer, usage_known, status = REFUSAL, True, "blocked"
        else:
            yield event("status", {"message": "Looking through Pavel’s work…"})
            answer, sources, usage_known = rag.generate(redact(question), history, usage)
            status = "completed"
            if not safe_answer(answer):
                answer, sources, status = REFUSAL, [], "blocked"
        store.finish(request_id, answer, sources, usage, status,
                     int((time.monotonic() - started) * 1000), usage_known=usage_known)
        settled = True
        yield event("status", {"message": ""})
        for word in re.findall(r"\S+\s*", answer):
            yield event("delta", {"text": word})
            time.sleep(0.018)
        yield event("done", {})
    except GeneratorExit:
        raise
    except Exception:
        logger.warning("Pavel-bot request failed; request_id=%s", request_id)
        yield event("error", {"message": "I couldn’t finish that reply. Please try again in a moment."})
    finally:
        if not settled:
            try:
                store.finish(request_id, "", [], usage, "error", int((time.monotonic() - started) * 1000),
                             error_code="interrupted_or_failed", usage_known=False)
            except Exception:
                logger.error("Pavel-bot settlement unavailable; request_id=%s", request_id)


@never_cache
@require_POST
def chat(request):
    if request.content_type != "application/json":
        return failure(store.ChatError("Send a JSON message.", 415))
    try:
        if len(request.body) > 8192:
            raise ValueError()
        body = json.loads(request.body)
        if not isinstance(body, dict) or set(body) - {"question", "conversation_id", "request_id"}:
            raise ValueError()
        question = body["question"]
        if not isinstance(question, str) or not question.strip() or len(question) > cfg.MAX_QUESTION_CHARS:
            raise ValueError()
        question = question.strip()
        question.encode('utf-8')
        if not isinstance(body.get('request_id'), str):
            raise ValueError()
        if body.get('conversation_id') is not None and not isinstance(body['conversation_id'], str):
            raise ValueError()
        if rag.tokens(question) > cfg.MAX_QUESTION_TOKENS:
            return failure(store.ChatError("Please shorten your question a little.", 400))
        request_id = uuid.UUID(body["request_id"])
        conversation_id = str(uuid.UUID(body["conversation_id"])) if body.get("conversation_id") else None
    except (ValueError, KeyError, TypeError):
        return failure(store.ChatError("Please enter a question of up to 1,200 characters.", 400))
    if not request.COOKIES.get(cfg.COOKIE):
        return failure(store.ChatError("Please refresh the page before sending your message.", 403))
    try:
        if not public_ready():
            return failure(store.ChatError("Pavel-bot is unavailable right now. Please try again later.", 503))
        conversation_id, history = store.admit(store.identity(visitor(request)), ip_key(request), conversation_id, request_id, question)
    except store.ChatError as error:
        return failure(error)
    except Exception:
        logger.warning("Pavel-bot admission unavailable")
        return failure(store.ChatError("Pavel-bot is unavailable right now. Please try again later.", 503))
    response = StreamingHttpResponse(stream_answer(question, history, conversation_id, request_id), content_type="text/event-stream")
    response["Cache-Control"] = "no-store, no-transform"
    response["X-Accel-Buffering"] = "no"
    response["X-Content-Type-Options"] = "nosniff"
    return response
