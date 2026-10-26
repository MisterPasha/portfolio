r"""Optional real-SQL checks using session-local tables, always rolled back.

From backend: .\.venv\Scripts\python.exe -m chatbot.postgres_checks
Requires the normal Neon DATABASE_URL. Makes no OpenAI calls and changes no
permanent tables. Does not simulate a distributed load test.
"""
import json
import os
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
import django
django.setup()

from . import config as cfg, rag, store


def run():
    original_connect = store.connect
    conn = original_connect()
    checks = []

    @contextmanager
    def temporary_connection():
        # SAVEPOINT per application operation; the outer transaction is never committed.
        with conn.transaction():
            yield conn

    def clear():
        conn.execute("DELETE FROM pavelbot_turns")
        conn.execute("DELETE FROM pavelbot_conversations")
        conn.execute("DELETE FROM pavelbot_budgets")
        conn.execute("DELETE FROM pavelbot_rate_limits")

    def reject(call, status):
        try:
            call()
        except store.ChatError as error:
            assert error.status == status, error.status
        else:
            raise AssertionError("Expected request to be rejected")

    try:
        sql = (Path(__file__).resolve().parents[1] / "sql/001_pavelbot.sql").read_text(encoding="utf-8")
        sql = sql.replace("BEGIN;", "").replace("COMMIT;", "").replace("CREATE TABLE IF NOT EXISTS", "CREATE TEMP TABLE")
        conn.execute(sql, prepare=False)
        checks.append("schema DDL")
        review_sql = (Path(__file__).resolve().parents[1] / "sql/002_review_public_knowledge.sql").read_text(encoding="utf-8")
        conn.execute(review_sql, prepare=False)
        assert conn.execute('SELECT count(*) AS n FROM pavelbot_public_chunks WHERE is_public=true').fetchone()['n'] == 0
        checks.append("review SQL stages revisions without publishing")
        # All pavelbot_* names now resolve to this connection's TEMP tables.
        row = conn.execute("SELECT document_id,chunk_index,content_hash,embedding FROM knowledge_chunks WHERE document_id='project-hi5' LIMIT 1").fetchone()
        assert row, "The Hi5 document must be ingested to run retrieval checks."
        conn.execute("""INSERT INTO pavelbot_public_chunks (document_id,chunk_index,content_hash,is_public) VALUES (%s,%s,%s,true)
            ON CONFLICT (document_id,chunk_index,content_hash) DO UPDATE SET is_public=true""",
                     (row['document_id'], row['chunk_index'], row['content_hash']))
        embedding = json.loads(row['embedding'])
        client = MagicMock()
        client.embeddings.create.return_value = SimpleNamespace(usage=SimpleNamespace(total_tokens=8), data=[SimpleNamespace(embedding=embedding)])

        with patch.object(store, 'connect', temporary_connection), patch.object(rag, 'connect', temporary_connection):
            context, sources = rag.retrieve(client, 'Hi5', {})
            assert context and len(sources) == 1
            checks.append("real pgvector/public-revision query")
            request_id = uuid.uuid4()
            conversation_id, history = store.admit('owner', 'ip', None, request_id, 'What is Hi5?')
            assert not history
            reject(lambda: store.admit('owner', 'ip', conversation_id, uuid.uuid4(), 'Again?'), 429)
            reject(lambda: store.admit('stranger', 'other-ip', conversation_id, uuid.uuid4(), 'Again?'), 404)
            reject(lambda: store.admit('owner', 'ip', conversation_id, request_id, 'Again?'), 409)
            checks.extend(["concurrent-owner rejection", "conversation ownership", "duplicate request rejection"])

            usage = {'input_tokens': 1000, 'output_tokens': 100, 'embedding_tokens': 8}
            store.finish(request_id, 'Pavel contributed to Hi5.', sources, usage, 'completed', 20)
            charged = conn.execute("SELECT charged_usd FROM pavelbot_budgets WHERE kind='month'").fetchone()['charged_usd']
            assert charged == cfg.cost(1000, 100, 8)
            store.finish(request_id, 'Duplicate', [], {}, 'completed', 20)
            assert conn.execute("SELECT charged_usd FROM pavelbot_budgets WHERE kind='month'").fetchone()['charged_usd'] == charged
            messages = store.conversation('owner', conversation_id)
            assert len(messages) == 2 and messages[-1]['text'] == 'Pavel contributed to Hi5.'
            next_id = uuid.uuid4()
            _, history = store.admit('owner', 'ip', conversation_id, next_id, 'What was his role?')
            assert len(history) == 1
            store.finish(next_id, '', [], {'embedding_tokens': 8}, 'error', 20, usage_known=False)
            assert conn.execute("SELECT charged_usd FROM pavelbot_budgets WHERE kind='month'").fetchone()['charged_usd'] == charged + cfg.RESERVATION
            checks.extend(["measured settlement", "idempotent settlement", "history recovery", "unknown-usage reservation retained"])

            conn.execute("UPDATE pavelbot_public_chunks SET is_public=false")
            assert rag.retrieve(client, 'Hi5', {}) == ('', [])
            assert store.conversation('owner', conversation_id)[1]['text'].startswith('This reply is no longer available')
            after_revoke = uuid.uuid4()
            _, history = store.admit('owner', 'ip', conversation_id, after_revoke, 'Tell me more')
            assert not history
            store.finish(after_revoke, '', [], {}, 'error', 10, usage_known=False)
            checks.append("revocation removes retrieval, recovered answer and model history")

            clear()
            with patch.object(cfg, 'MONTHLY_BUDGET', cfg.RESERVATION):
                store.admit('owner-1', 'ip-1', None, uuid.uuid4(), 'Hi')
                reject(lambda: store.admit('owner-2', 'ip-2', None, uuid.uuid4(), 'Hi'), 429)
                assert conn.execute("SELECT count(*) AS n FROM pavelbot_turns").fetchone()['n'] == 1
            checks.append("atomic monthly reservation cutoff")

            clear()
            with patch.object(store, 'datetime', wraps=datetime) as clock:
                clock.now.return_value = datetime.now(timezone.utc)
                for index in range(5):
                    turn = uuid.uuid4()
                    store.admit(f'owner-{index}', 'shared-ip', None, turn, 'Hi')
                    store.finish(turn, 'Hello', [], {}, 'completed', 1)
                reject(lambda: store.admit('new-owner', 'shared-ip', None, uuid.uuid4(), 'Hi'), 429)
            checks.append("IP limits survive cookie/conversation changes")

            # The application lock is genuinely cross-connection, not a process mutex.
            other = original_connect()
            try:
                assert not other.execute('SELECT pg_try_advisory_xact_lock(728491503) AS acquired').fetchone()['acquired']
            finally:
                other.rollback()
                other.close()
            checks.append("cross-connection admission lock")
        print(json.dumps({'passed': checks, 'permanent_changes': False, 'openai_calls': 0}, indent=2))
    finally:
        conn.rollback()
        conn.close()


if __name__ == '__main__':
    run()
