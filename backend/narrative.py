"""Narrative extraction: message -> entities. LLM first, regex fallback so demo never dies."""
import os
import re

UPI_RE = re.compile(r"[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}")
PHONE_RE = re.compile(r"\+?91[\s\-]?\d{5}[\s\-]?\d{5}|\b\d{10}\b")
URL_RE = re.compile(r"(?:https?://)?(?:www\.)?[a-zA-Z0-9\-]+\.(?:com|in|io|net|org)[^\s]*")
WALLET_RE = re.compile(r"0x[a-fA-F0-9]{40}|0x[a-fA-F0-9]{10,}")
AMOUNT_RE = re.compile(r"(?:Rs\.?|INR|₹)\s?([\d,]+)|([\d,]+)\s?(?:hajar|hazaar|thousand|rupees?)", re.IGNORECASE)
TELEGRAM_RE = re.compile(r"@[a-zA-Z0-9_]{4,}|t\.me/[^\s]+", re.IGNORECASE)

def regex_extract(text: str) -> list[dict]:
    out = []
    for m in UPI_RE.findall(text):
        if "@" in m and len(m) < 60:
            out.append({"type": "upi", "value": m, "source": "message"})
    for m in PHONE_RE.findall(text):
        out.append({"type": "phone", "value": m.strip(), "source": "message"})
    for m in URL_RE.findall(text):
        out.append({"type": "website", "value": m, "source": "message"})
    for m in WALLET_RE.findall(text):
        out.append({"type": "wallet", "value": m, "source": "message"})
    for m in AMOUNT_RE.findall(text):
        val = (m[0] or m[1]).replace(",", "")
        if val:
            out.append({"type": "amount", "value": val, "source": "message"})
    for m in TELEGRAM_RE.findall(text):
        out.append({"type": "telegram", "value": m, "source": "message"})
    # dedupe
    seen, deduped = set(), []
    for e in out:
        k = (e["type"], e["value"])
        if k not in seen:
            seen.add(k)
            deduped.append(e)
    return deduped

TYPE_ALIASES = {"upi_id": "upi", "vpa": "upi", "phone_number": "phone", "mobile": "phone",
                "url": "website", "link": "website", "domain": "website", "wallet_address": "wallet",
                "address": "wallet", "money": "amount", "price": "amount", "handle": "telegram"}

def _norm_type(t: str) -> str:
    t = (t or "claim").strip().lower().replace(" ", "_")
    return TYPE_ALIASES.get(t, t)

def _coerce(items) -> list[dict]:
    """Accept [{type,value}] or plain ["value"] lists from any LLM."""
    out = []
    for i in items:
        if isinstance(i, dict) and i.get("value"):
            out.append({"type": _norm_type(i.get("type", "claim")), "value": str(i["value"]), "source": "message"})
        elif isinstance(i, str) and i.strip():
            v = i.strip()
            t = "upi" if "@" in v else ("wallet" if v.startswith("0x") else ("website" if "." in v and " " not in v else "claim"))
            out.append({"type": t, "value": v, "source": "message"})
    if not out:
        raise ValueError("empty LLM result")
    return out

def llm_extract(text: str) -> list[dict]:
    """Try Gemini -> Groq -> regex. Never throws."""
    # Gemini (free, 1M context, best for Hinglish)
    try:
        if os.getenv("GEMINI_API_KEY"):
            import google.generativeai as genai
            genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
            model = genai.GenerativeModel("gemini-3.8-flash")
            r = model.generate_content(
                f"Extract entities as JSON list of {{type, value}} from this fraud message. "
                f"Types: person,company,phone,upi,website,telegram,wallet,token,amount,claim,date.\n\n{text[:4000]}",
                request_options={"timeout": 25},
            )
            import json
            txt = r.text.strip().replace("```json", "").replace("```", "")
            items = json.loads(txt)
            return _coerce(items)
    except Exception:
        pass
    # Groq fallback
    try:
        if os.getenv("GROQ_API_KEY"):
            from groq import Groq
            client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            r = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[{"role": "user", "content": f"Extract UPI IDs, phones, URLs, wallets, amounts as JSON list: {text[:2000]}"}],
                max_tokens=800,
            )
            import json
            txt = r.choices[0].message.content.strip().replace("```json", "").replace("```", "")
            items = json.loads(txt)
            return _coerce(items)
    except Exception:
        pass
    return regex_extract(text)

def extract(text: str) -> list[dict]:
    entities = llm_extract(text)
    # always union with regex so UPI/phone never missed
    reg = regex_extract(text)
    have = {(e["type"], e["value"]) for e in entities}
    for e in reg:
        if (e["type"], e["value"]) not in have:
            entities.append(e)
    return entities
