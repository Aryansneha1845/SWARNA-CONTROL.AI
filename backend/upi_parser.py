"""UPI/bank parser: OCR + regex + manual fallback."""
import re

AMT_RE = re.compile(r"(?:Rs\.?|INR|₹)\s?([\d,]+\.?\d*)", re.IGNORECASE)
VPA_RE = re.compile(r"[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}")
UTR_RE = re.compile(r"\b\d{12}\b|UTR[:\s]*(\d+)", re.IGNORECASE)
TIME_RE = re.compile(r"\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM|am|pm)?")

def parse_text(text: str) -> dict:
    amt = AMT_RE.search(text)
    vpa = VPA_RE.search(text)
    utr = UTR_RE.search(text)
    t = TIME_RE.search(text)
    return {
        "amount_inr": float(amt.group(1).replace(",", "")) if amt else None,
        "beneficiary_vpa": vpa.group(0) if vpa else None,
        "txn_id": (utr.group(1) or utr.group(0)) if utr else None,
        "time_hint": t.group(0) if t else None,
    }

def parse_image(path: str) -> dict:
    try:
        import pytesseract
        from PIL import Image
        text = pytesseract.image_to_string(Image.open(path))
        return {"ocr_text": text, **parse_text(text)}
    except Exception as e:
        return {"error": str(e), "ocr_text": ""}
