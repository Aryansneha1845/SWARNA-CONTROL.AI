"""SWARN-CONTROL.AI API. No chatbox logic — investigation only."""
import json
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
import narrative, resolver, trace as trace_mod, upi_parser, control

app = FastAPI(title="SWARN-CONTROL.AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
FIX = Path(__file__).parent.parent / "fixtures"

class InvestigateIn(BaseModel):
    message_text: str = ""
    upi: dict = {}
    upi_text: str = ""
    tx_hash: str = ""

def _merge_upi(upi: dict, upi_text: str) -> dict:
    merged = dict(upi or {})
    if upi_text:
        parsed = upi_parser.parse_text(upi_text)
        for k in ("amount_inr", "beneficiary_vpa", "txn_id"):
            if not merged.get(k) and parsed.get(k):
                merged[k] = parsed[k]
        if parsed.get("time_hint") and not merged.get("timestamp"):
            merged["timestamp"] = "2026-10-01T12:41:07+05:30"
    merged.setdefault("timestamp", "2026-10-01T12:41:07+05:30")
    merged.setdefault("rail", "upi")
    return merged

@app.get("/health")
def health():
    return {"ok": True, "service": "swarn-control"}

@app.post("/extract-narrative")
def extract_narrative(body: dict):
    return {"entities": narrative.extract(body.get("text", ""))}

@app.post("/parse-upi")
def parse_upi(body: dict):
    text = body.get("text", "")
    return {"parsed": upi_parser.parse_text(text)}

@app.post("/investigate")
def investigate(body: InvestigateIn):
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
            "chain": chain, "current_destination": dest, "hindi_summary": hindi}

@app.post("/control-pack")
def control_pack(body: dict):
    upi = _merge_upi(body.get("upi", {}), body.get("upi_text", ""))
    phones = [e["value"] for e in (body.get("entities") or []) if e.get("type") == "phone"]
    masks = control.redact(upi.get("beneficiary_vpa"), phones[0] if phones else None)
    wallet = (body.get("current_destination") or "")[:20]
    return {
        "masks": masks,
        "chakshu": control.chakshu_draft(upi.get("amount_inr"), masks["vpa_masked"], upi.get("txn_id"), upi.get("timestamp"), wallet),
        "scores": control.scores_draft(upi.get("amount_inr"), masks["vpa_masked"], upi.get("txn_id")),
        "family_hindi": control.family_alert_hindi(upi.get("amount_inr"), masks["vpa_masked"]),
        "freeze": control.freeze_checklist(),
    }

@app.post("/tts-hindi")
def tts_hindi(body: dict):
    import asyncio, uuid, os
    text = body.get("text", "")[:500]
    out_dir = Path("/tmp") if os.name != "nt" else Path(os.getenv("TEMP", "."))
    out = str(out_dir / f"swarn_{uuid.uuid4().hex[:8]}.mp3")
    async def _run():
        import edge_tts
        await edge_tts.Communicate(text, "hi-IN-SwaraNeural").save(out)
    try:
        asyncio.run(_run())
        return {"audio": out, "ok": True}
    except Exception as e:
        return {"audio": "", "ok": False, "error": str(e), "fallback": "Use browser speechSynthesis with hi-IN voice"}
