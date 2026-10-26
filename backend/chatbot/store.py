"""Durable, cross-worker admission control and a private audit trail in Neon."""
import hashlib
import hmac
import os
import uuid
from datetime import datetime, timedelta, timezone

import psycopg
from django.conf import settings
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from . import config as cfg
from .safety import redact


class ChatError(Exception):
    def __init__(self, message, status=429, retry_after=60):
        self.message, self.status, self.retry_after = message, status, retry_after
        super().__init__(message)


def connect():
    conn = psycopg.connect(os.environ["DATABASE_URL"], connect_timeout=5, row_factory=dict_row)
    try:
        # Transaction-local settings work with Neon's pooled endpoints as well.
        conn.execute("SET LOCAL statement_timeout='5s'")
        conn.execute("SET LOCAL lock_timeout='3s'")
        return conn
    except Exception:
        conn.close()
        raise


def identity(value):
    return hmac.new(settings.SECRET_KEY.encode(), value.encode(), hashlib.sha256).hexdigest()


def lock(conn):
    # One short database lock serializes admission/settlement on every worker.
    conn.execute("SELECT pg_advisory_xact_lock(728491503)")


def periods(now):
    return [("month", now.replace(day=1, hour=0, minute=0, second=0, microsecond=0), cfg.MONTHLY_BUDGET),
            ("day", now.replace(hour=0, minute=0, second=0, microsecond=0), cfg.DAILY_BUDGET)]


# Previously generated answers are not evidence once any supporting revision has
# been revoked or replaced. Empty-source refusals remain safe to display.
CURRENT_SOURCES = """NOT EXISTS (
    SELECT 1 FROM jsonb_array_elements(t.sources) s
    WHERE NOT EXISTS (
        SELECT 1 FROM pavelbot_public_chunks p JOIN knowledge_chunks k
        USING (document_id,chunk_index,content_hash)
        WHERE p.is_public=true AND p.document_id=s->>'document_id'
          AND p.chunk_index=(s->>'chunk_index')::integer AND p.content_hash=s->>'content_hash'
    )
)"""


def admit(owner, ip_hash, conversation_id, request_id, question):
    now = datetime.now(timezone.utc)
    with connect() as conn:
        lock(conn)
        if conn.execute("SELECT 1 FROM pavelbot_turns WHERE request_id=%s", (request_id,)).fetchone():
            raise ChatError("This message has already been sent. Refresh to recover the conversation.", 409)
        if conversation_id:
            conversation = conn.execute(
                "SELECT * FROM pavelbot_conversations WHERE id=%s AND owner_hash=%s FOR UPDATE",
                (conversation_id, owner)).fetchone()
            if not conversation:
                raise ChatError("This conversation is no longer available. Start a new chat.", 404)
        else:
            conversation_id = uuid.uuid4()
            conn.execute("INSERT INTO pavelbot_conversations (id,owner_hash) VALUES (%s,%s)", (conversation_id, owner))
        turns = conn.execute("SELECT count(*) AS n FROM pavelbot_turns WHERE conversation_id=%s", (conversation_id,)).fetchone()["n"]
        if turns >= cfg.MAX_TURNS:
            raise ChatError("This conversation has reached its limit. Start a new chat to continue.", 409)
        # Stale reservations still consume budget, but do not block concurrency forever.
        active = conn.execute("""SELECT owner_hash FROM pavelbot_turns
            WHERE status='pending' AND created_at > %s""", (now - timedelta(seconds=120),)).fetchall()
        if len(active) >= 4 or any(row["owner_hash"] == owner for row in active):
            raise ChatError("A reply is already in progress. Please try again shortly.", 429, 15)
        for kind, start, cap in periods(now):
            conn.execute("INSERT INTO pavelbot_budgets (kind,period_start) VALUES (%s,%s) ON CONFLICT DO NOTHING", (kind, start))
            amount = conn.execute("SELECT charged_usd FROM pavelbot_budgets WHERE kind=%s AND period_start=%s", (kind, start)).fetchone()["charged_usd"]
            if amount + cfg.RESERVATION > cap:
                raise ChatError("Pavel-bot is taking a break. Please come back later or contact Pavel on LinkedIn.", 429, 3600)
        # IP limits remain effective when cookies/conversations are reset.
        for key, seconds, limit in [(f"ip-minute:{ip_hash}", 60, 5), (f"ip-hour:{ip_hash}", 3600, 30),
                                    (f"ip-day:{ip_hash}", 86400, 60), ("global-day", 86400, 300)]:
            bucket = datetime.fromtimestamp(int(now.timestamp()) // seconds * seconds, timezone.utc)
            row = conn.execute("""INSERT INTO pavelbot_rate_limits (key,bucket_start,hits) VALUES (%s,%s,1)
                ON CONFLICT (key,bucket_start) DO UPDATE SET hits=pavelbot_rate_limits.hits+1 RETURNING hits""", (key, bucket)).fetchone()
            if row["hits"] > limit:
                retry = max(1, int((bucket + timedelta(seconds=seconds) - now).total_seconds()))
                raise ChatError("A few too many messages. Please wait a little before trying again.", 429, retry)
        for kind, start, _ in periods(now):
            conn.execute("UPDATE pavelbot_budgets SET charged_usd=charged_usd+%s WHERE kind=%s AND period_start=%s",
                         (cfg.RESERVATION, kind, start))
        conn.execute("""INSERT INTO pavelbot_turns
            (request_id,conversation_id,owner_hash,question,model,embedding_model,reserved_usd,created_at)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)""",
            (request_id, conversation_id, owner, redact(question), cfg.MODEL, cfg.EMBEDDING_MODEL, cfg.RESERVATION, now))
        history = conn.execute(f"""SELECT question,answer FROM pavelbot_turns t
            WHERE conversation_id=%s AND status='completed' AND {CURRENT_SOURCES}
            ORDER BY created_at DESC LIMIT 6""", (conversation_id,)).fetchall()
    return str(conversation_id), list(reversed(history))


def finish(request_id, answer, sources, usage, status, latency_ms, error_code="", usage_known=True):
    amount = cfg.cost(usage.get("input_tokens", 0), usage.get("output_tokens", 0), usage.get("embedding_tokens", 0))
    with connect() as conn:
        lock(conn)
        turn = conn.execute("SELECT * FROM pavelbot_turns WHERE request_id=%s FOR UPDATE", (request_id,)).fetchone()
        if turn["status"] != "pending":
            return
        # Unknown provider usage (timeouts/disconnects) keeps the FULL reservation.
        charged = amount if usage_known else max(amount, turn["reserved_usd"])
        for kind, start, _ in periods(turn["created_at"]):
            conn.execute("UPDATE pavelbot_budgets SET charged_usd=charged_usd+%s WHERE kind=%s AND period_start=%s",
                         (charged - turn["reserved_usd"], kind, start))
        conn.execute("""UPDATE pavelbot_turns SET answer=%s,sources=%s,input_tokens=%s,output_tokens=%s,
            embedding_tokens=%s,estimated_cost_usd=%s,charged_usd=%s,usage_estimated=%s,status=%s,
            latency_ms=%s,error_code=%s,finished_at=now() WHERE request_id=%s""",
            (redact(answer), Jsonb(sources), usage.get("input_tokens", 0), usage.get("output_tokens", 0),
             usage.get("embedding_tokens", 0), amount, charged, not usage_known, status, latency_ms, error_code, request_id))


def conversation(owner, conversation_id):
    with connect() as conn:
        if not conn.execute("SELECT 1 FROM pavelbot_conversations WHERE id=%s AND owner_hash=%s", (conversation_id, owner)).fetchone():
            raise ChatError("This conversation is no longer available.", 404)
        rows = conn.execute(f"""SELECT request_id,question,answer,sources,status,{CURRENT_SOURCES} AS is_current FROM pavelbot_turns t
            WHERE conversation_id=%s ORDER BY created_at LIMIT %s""", (conversation_id, cfg.MAX_TURNS)).fetchall()
    messages = []
    for row in rows:
        messages.append({"id": f"{row['request_id']}-user", "role": "user", "text": row["question"]})
        if row["answer"] and not row["is_current"]:
            messages.append({"id": str(row["request_id"]), "role": "assistant", "text": "This reply is no longer available. Please ask your question again."})
        elif row["answer"]:
            messages.append({"id": str(row["request_id"]), "role": "assistant", "text": row["answer"]})
        elif row["status"] == "pending":
            messages.append({"id": str(row["request_id"]), "role": "assistant", "text": "This reply was interrupted. You can send another question shortly."})
    return messages
