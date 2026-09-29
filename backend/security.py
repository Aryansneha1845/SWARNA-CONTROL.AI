"""Shared security helpers: sanitization, API-key auth, security headers."""
import hmac
import os
import re

TAG_RE = re.compile(r"<[^>]*>")
CTRL_RE = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")


def sanitize_text(value: object, max_len: int) -> str:
    """Strip HTML/tags + control chars, collapse whitespace, hard-truncate.
    Prevents stored/reflected XSS payloads from ever reaching logs, files or echoes."""
    if not isinstance(value, str):
        return ""
    clean = TAG_RE.sub("", value)
    clean = CTRL_RE.sub("", clean)
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean[:max_len]


def sanitize_hash(value: object) -> str:
    """Tx hashes: only 0x + hex, max 66 chars. Anything else -> '' (cached fallback)."""
    if not isinstance(value, str):
        return ""
    v = value.strip().lower()
    if not v.startswith("0x"):
        return ""
    v = "0x" + re.sub(r"[^0-9a-f]", "", v[2:])[:64]
    return v if len(v) > 10 else ""


def api_key_ok(provided: str | None) -> bool:
    """Enforced only when SWARN_API_KEY is configured. Timing-safe compare."""
    expected = os.getenv("SWARN_API_KEY", "")
    if not expected:
        return True  # dev mode: open, rely on CORS + rate limits. Set key in prod.
    return bool(provided) and hmac.compare_digest(provided, expected)


async def add_security_headers(request, call_next):
    resp = await call_next(request)
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    resp.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
    if os.getenv("ENV", "dev") == "prod":
        resp.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains"
    return resp
