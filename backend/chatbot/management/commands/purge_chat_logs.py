from datetime import datetime, timedelta, timezone
from django.core.management.base import BaseCommand
from chatbot.config import RETENTION_DAYS
from chatbot.store import connect, lock


class Command(BaseCommand):
    help = "Remove expired private chat content and rate-limit buckets; retain spending totals."

    def handle(self, *args, **options):
        if RETENTION_DAYS <= 0:
            self.stdout.write("Log retention is unlimited; no logs removed.")
            return
        with connect() as conn:
            lock(conn)
            cutoff = datetime.now(timezone.utc) - timedelta(days=RETENTION_DAYS)
            result = conn.execute("DELETE FROM pavelbot_turns WHERE created_at < %s", (cutoff,))
            count = result.rowcount
            conn.execute("""DELETE FROM pavelbot_conversations c WHERE NOT EXISTS
                (SELECT 1 FROM pavelbot_turns t WHERE t.conversation_id=c.id)""")
            conn.execute("DELETE FROM pavelbot_rate_limits WHERE bucket_start < now()-interval '2 days'")
        self.stdout.write(f"Removed {count} expired turns; spending totals preserved.")
