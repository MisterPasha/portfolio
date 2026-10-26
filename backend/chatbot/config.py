"""Server-only limits. Monetary amounts are USD, never supplied by a visitor."""
import os
from decimal import Decimal

MODEL = "gpt-6-luna"
EMBEDDING_MODEL = "text-embedding-3-small"
MAX_QUESTION_CHARS = 1200
MAX_QUESTION_TOKENS = 400
MAX_CONTEXT_TOKENS = 2200
MAX_HISTORY_TOKENS = 1400
MAX_INPUT_TOKENS = 5000
MAX_INPUT_BYTES = 18000
MAX_OUTPUT_TOKENS = 450
MAX_TURNS = 20
TOP_K = 5
# Standard service-tier prices per million tokens, checked 25 October 2026.
INPUT_RATE = Decimal("0.10")
OUTPUT_RATE = Decimal("0.50")
EMBEDDING_RATE = Decimal("0.02")
# Includes headroom above the byte-bound maximum request cost at these rates.
RESERVATION = Decimal("0.005000")
MONTHLY_BUDGET = min(Decimal(os.getenv("CHAT_MONTHLY_BUDGET_USD", "8")), Decimal("10"))
DAILY_BUDGET = min(Decimal(os.getenv("CHAT_DAILY_BUDGET_USD", "0.50")), MONTHLY_BUDGET)
RETENTION_DAYS = int(os.getenv("CHAT_LOG_RETENTION_DAYS", "30"))
COOKIE = "pavelbot_visitor"


def cost(input_tokens=0, output_tokens=0, embedding_tokens=0):
    return (input_tokens * INPUT_RATE + output_tokens * OUTPUT_RATE
            + embedding_tokens * EMBEDDING_RATE) / Decimal(1_000_000)
