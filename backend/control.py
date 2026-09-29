"""Control pack: report drafts + family alert + freeze checklist. No advice, only process help."""
def redact(vpa: str | None, phone: str | None = None) -> dict:
    def _mask_vpa(v):
        if not v or "@" not in v:
            return "***"
        name, handle = v.split("@", 1)
        return (name[:2] + "***@" + handle) if len(name) > 2 else ("***@" + handle)
    def _mask_phone(p):
        if not p:
            return "***"
        d = "".join(c for c in p if c.isdigit())
        return ("******" + d[-4:]) if len(d) >= 4 else "***"
    return {"vpa_masked": _mask_vpa(vpa or ""), "phone_masked": _mask_phone(phone or "")}

def chakshu_draft(amount, vpa, utr, date_hint, wallet="") -> str:
    return (
        f"Subject: Suspected fraud - UPI payment report (Chakshu/Sanchar Saathi)\n\n"
        f"Namaste, mujhe ek sandigdh message ke baad payment karna pada.\n"
        f"Amount: Rs {amount}\nUPI ID: {vpa}\nUTR/Ref: {utr}\nDate: {date_hint}\n"
        f"Crypto trail (if any): {wallet}\n"
        f"Message sample: investment double scheme, Telegram lure.\n"
        f"Kripya is number/UPI/website ki jaanch karein. Maine aage koi payment rok diya hai.\n"
        f"Report via: Sanchar Saathi Chakshu (https://sancharsaathi.gov.in) + cybercrime.gov.in + bank helpline 1930.\n"
    )

def scores_draft(amount, vpa, utr) -> str:
    return (
        f"SCORES Grievance Draft (SEBI)\n"
        f"Category: Fraud / Unregistered investment scheme\n"
        f"Details: Paid Rs {amount} to {vpa} (Ref {utr}) after Telegram/WhatsApp lure promising double returns. "
        f"Request guidance on recovery/reporting process. No investment advice sought.\n"
        f"File at: https://scores.sebi.gov.in + keep UTR screenshots safe. Call 1930 immediately for bank lien request.\n"
    )

def family_alert_hindi(amount, vpa) -> str:
    return (
        f"Parivar alert: Maine galti se Rs {amount} {vpa} pe bhej diye ek jhoothe double-paise wale message pe. "
        f"Aage koi paisa mat bhejo is number/link pe. Maine report kar diya hai. Koi OTP/share mat karna."
    )

def freeze_checklist() -> list[str]:
    return [
        "1. Aage koi payment mat karo - UPI autopay/permission check karo",
        "2. Bank ko 1930 pe call karo - lien/freeze request + UTR note karao",
        "3. Chakshu (Sanchar Saathi) + cybercrime.gov.in pe report karo",
        "4. Screenshots (message, UPI, hash) ek folder me sambhal ke rakho",
        "5. UPI app me unknown VPA ko block/report karo",
        "6. Parivar ko Hindi alert bhejo - koi aur na phase",
        "7. SCORES pe grievance (sirf process help, tips nahi)",
    ]
