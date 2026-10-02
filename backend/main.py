"""SWARN-CONTROL.AI API. No chatbox logic — investigation only.

Security posture:
- CORS locked to FRONTEND_ORIGIN (no wildcard)
- Rate limits on every POST (slowapi, per-IP)
- All inputs sanitized + length-capped (XSS / payload abuse)
- X-API-Key enforced whenever SWARN_API_KEY is set (proxied server-side by Next.js)
- /docs + /redoc + /openapi.json disabled in prod (ENV=prod)
- Security headers on every response
"""
import json
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request, Header, HTTPException, Depends

# Allow both `uvicorn main:app` (from backend/) and `uvicorn backend.main:app` (from root)
import sys as _sys
from pathlib import Path as _Path
_sys.path.insert(0, str(_Path(__file__).parent))
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

load_dotenv()
import narrative  # noqa: E402
import resolver  # noqa: E402
import trace as trace_mod  # noqa: E402
import upi_parser  # noqa: E402
import control  # noqa: E402
from security import (  # noqa: E402
    sanitize_text, sanitize_hash, api_key_ok, add_security_headers,
)

ENV = os.getenv("ENV", "dev")
IS_PROD = ENV == "prod"

app = FastAPI(
    title="SWARN-CONTROL.AI",
    docs_url=None if IS_PROD else "/docs",
    redoc_url=None if IS_PROD else "/redoc",
    openapi_url=None if IS_PROD else "/openapi.json",
)

# --- CORS: explicit origins only, least privilege ---
_origins = [o.strip() for o in os.getenv(
    "FRONTEND_ORIGIN", "http://localhost:3000").split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
    max_age=600,
)
app.middleware("http")(add_security_headers)

# --- Rate limiting (in-memory; single worker. Use Redis limiter for multi-worker prod) ---
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


def require_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")) -> None:
    if not api_key_ok(x_api_key):
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


FIX = Path(__file__).parent.parent / "fixtures"


class InvestigateIn(BaseModel):
    message_text: str = Field(default="", max_length=4000)
    upi: dict = Field(default_factory=dict)
    upi_text: str = Field(default="", max_length=500)
    tx_hash: str = Field(default="", max_length=70)

    @field_validator("message_text", mode="before")
    @classmethod
    def _clean_message(cls, v):
        return sanitize_text(v, 4000)

    @field_validator("upi_text", mode="before")
    @classmethod
    def _clean_upi_text(cls, v):
        return sanitize_text(v, 500)

    @field_validator("tx_hash", mode="before")
    @classmethod
    def _clean_hash(cls, v):
        return sanitize_hash(v)

    @field_validator("upi", mode="before")
    @classmethod
    def _clean_upi(cls, v):
        if not isinstance(v, dict):
            return {}
        out = {}
        for k in ("beneficiary_vpa", "txn_id", "timestamp"):
            if isinstance(v.get(k), str):
                out[k] = sanitize_text(v[k], 120)
        if isinstance(v.get("amount_inr"), (int, float)) and 0 <= v["amount_inr"] < 1e9:
            out["amount_inr"] = v["amount_inr"]
        return out


def _merge_upi(upi: dict, upi_text: str) -> dict:
    merged = dict(upi or {})
    if upi_text:
        parsed = upi_parser.parse_text(upi_text)
        for k in ("amount_inr", "beneficiary_vpa", "txn_id"):
            if not merged.get(k) and parsed.get(k):
                merged[k] = parsed[k] if k == "amount_inr" else sanitize_text(parsed[k], 120)
        if parsed.get("time_hint") and not merged.get("timestamp"):
            merged["timestamp"] = "2026-10-01T12:41:07+05:30"
    merged.setdefault("timestamp", "2026-10-01T12:41:07+05:30")
    merged.setdefault("rail", "upi")
    return merged


@app.get("/health")
def health():
    return {"ok": True, "service": "swarn-control"}


@app.post("/extract-narrative", dependencies=[Depends(require_key)])
@limiter.limit("30/minute")
def extract_narrative(request: Request, body: dict):
    text = sanitize_text(body.get("text", ""), 4000)
    return {"entities": narrative.extract(text)}


@app.post("/parse-upi", dependencies=[Depends(require_key)])
@limiter.limit("30/minute")
def parse_upi(request: Request, body: dict):
    text = sanitize_text(body.get("text", ""), 500)
    return {"parsed": upi_parser.parse_text(text)}


@app.post("/investigate", dependencies=[Depends(require_key)])
@limiter.limit("10/minute")
def investigate(request: Request, body: InvestigateIn):
    entities = narrative.extract(body.message_text)
    upi = _merge_upi(body.upi, body.upi_text)
    chain = trace_mod.trace(body.tx_hash) if body.tx_hash else json.loads(
        (FIX / "praveen_chain.json").read_text(encoding="utf-8"))
    links = resolver.resolve(entities, upi, chain)
    kc = resolver.kill_chain({"LURE": True, "TRUST": True, "PAYMENT_REQUEST": True,
                              "UPI_TRANSFER": bool(upi.get("beneficiary_vpa")),
                              "CRYPTO_CONVERSION": bool(body.tx_hash or chain.get("exchange_deposit")),
                              "OBFUSCATION": len(chain.get("after", [])) > 1, "CASH_OUT": False})
    dest = (chain.get("exchange_deposit", {}).get("tx_hash", "") or "")[:14] + "..."
    amt = upi.get("amount_inr", "")
    vpa = upi.get("beneficiary_vpa", "")
    hindi = (f"Aapke {amt} rupaye {vpa} pe gaye. Crypto me badal ke ab wallet me hain. "
             f"Aage mat bhejo. Chakshu pe report karo, parivar ko alert bhejo.")
    return {"entities": entities, "upi": upi, "links": links, "kill_chain": kc,
            "chain": chain, "current_destination": dest, "hindi_summary": hindi,
            "hindi_summary_deva": control.briefing_deva(amt, vpa)}


@app.post("/control-pack", dependencies=[Depends(require_key)])
@limiter.limit("20/minute")
def control_pack(request: Request, body: dict):
    upi = _merge_upi(
        {k: sanitize_text(v, 120) for k, v in (body.get("upi") or {}).items() if isinstance(v, str)},
        sanitize_text(body.get("upi_text", ""), 500),
    )
    ents = body.get("entities") or []
    phones = [sanitize_text(e.get("value", ""), 40) for e in ents[:50]
              if isinstance(e, dict) and e.get("type") == "phone"]
    masks = control.redact(upi.get("beneficiary_vpa"), phones[0] if phones else None)
    wallet = sanitize_text(body.get("current_destination", ""), 24)
    return {
        "masks": masks,
        "chakshu": control.chakshu_draft(upi.get("amount_inr"), masks["vpa_masked"], upi.get("txn_id"), upi.get("timestamp"), wallet),
        "scores": control.scores_draft(upi.get("amount_inr"), masks["vpa_masked"], upi.get("txn_id")),
        "family_hindi": control.family_alert_hindi(upi.get("amount_inr"), masks["vpa_masked"]),
        "freeze": control.freeze_checklist(),
    }


@app.post("/tts-hindi", dependencies=[Depends(require_key)])
@limiter.limit("10/minute")
def tts_hindi(request: Request, body: dict):
    import asyncio
    import uuid
    text = sanitize_text(body.get("text", ""), 500)
    out_dir = Path("/tmp") if os.name != "nt" else Path(os.getenv("TEMP", "."))
    out = str(out_dir / f"swarn_{uuid.uuid4().hex[:8]}.mp3")

    async def _run():
        import edge_tts
        await edge_tts.Communicate(text, "hi-IN-SwaraNeural").save(out)
    try:
        asyncio.run(_run())
        return JSONResponse({"audio": out, "ok": True})
    except Exception:
        return JSONResponse({"audio": "", "ok": False,
                             "fallback": "Use browser speechSynthesis with hi-IN voice"})
