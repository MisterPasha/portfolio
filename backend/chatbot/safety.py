"""Defence in depth; the actual confidentiality boundary is public-only retrieval."""
import re
import unicodedata
from urllib.parse import urlparse

PRIVATE_REQUEST = re.compile(
    r"api[ _-]?key|secret[ _-]?key|password|credentials?|connection[ _-]?string|"
    r"system[ _-]?(?:prompt|instructions?)|developer[ _-]?(?:prompt|message)|"
    r"private[ _-]?(?:email|phone|address|information|data)|home address|"
    r"phone number|medical|health records|family details|monthly budget|api budget|"
    r"database[ _-]?(?:url|password)|environment variables|\.env\b|"
    r"ignore (?:all |previous |your )*instructions|reveal.*(?:prompt|secret)", re.I,
)
SECRET = re.compile(
    r"sk-[a-zA-Z0-9_-]{16,}|(?:AKIA|ASIA)[A-Z0-9]{16}|"
    r"postgres(?:ql)?://\S+|-----BEGIN [A-Z ]*PRIVATE KEY-----|"
    r"(?:api_key|secret_key|password|DATABASE_URL)\s*[=:]\s*\S+", re.I,
)
EMAIL = re.compile(r"\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b")
PHONE = re.compile(r"(?<!\w)(?:\+\d[\d ()-]{8,}\d|0\d[\d ()-]{8,}\d)(?!\w)")
REFUSAL = "I can help with Pavel’s public projects, skills and experience. I can’t share private details, credentials or internal instructions."
UNKNOWN = "I don’t have enough public information to answer that. Try asking about Pavel’s projects, technical skills or experience."
PUBLIC_HOSTS = {"github.com", "www.github.com", "linkedin.com", "www.linkedin.com",
                "hi5project.co.uk", "www.hi5project.co.uk", "kumomochi.ee", "www.kumomochi.ee"}


def normalized(text):
    return "".join(c for c in unicodedata.normalize("NFKC", text) if unicodedata.category(c) != "Cf")


def private_request(text):
    return bool(PRIVATE_REQUEST.search(normalized(text)) or SECRET.search(text))


def redact(text):
    return PHONE.sub("[phone removed]", EMAIL.sub("[email removed]", SECRET.sub("[secret removed]", text)))


def safe_answer(text):
    # Never stream unchecked provider deltas. Obvious leaked secrets/contact data
    # are rejected as a whole, including data supplied by a visitor in prior turns.
    return not (SECRET.search(text) or EMAIL.search(text) or PHONE.search(text))


def public_links(links):
    result = []
    for label, url in (links or {}).items():
        if not isinstance(url, str):
            continue
        parsed = urlparse(url)
        if (parsed.scheme == "https" and parsed.hostname in PUBLIC_HOSTS
                and not parsed.username and not parsed.password and not parsed.query):
            result.append({"label": str(label)[:60], "url": url})
    return result
