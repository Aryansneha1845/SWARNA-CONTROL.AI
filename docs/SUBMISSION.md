# SANGYAN Submission Checklist — SWARN-CONTROL.AI

1. Working Prototype: `frontend/app/page.tsx` + `backend/main.py` (`/investigate` live, verified locally)
2. Problem: Praveen 22, Telegram lure -> UPI 50k -> crypto. Fragments disconnected.
3. Solution: Cross-rail join MESSAGE->UPI (Known fact) -> ON-RAMP (Supported, 17min) -> wallet + Before/After, every edge clickable Evidence.
4. Tech: Next.js + React Flow, FastAPI, NetworkX logic in resolver.py, Etherscan free + Ankr no-key + cached JSON fallback, Gemini->Groq->regex, Tesseract + edge-tts Hindi. Deterministic money, LLM only words.
5. Demo video 4-min: docs/DEMO_SCRIPT.md (no face/voice needed, AI Hindi + subtitles ok)
6. Impact: Tier-2/3 Hindi simple-mode, low-bandwidth, same flow for IPO/phishing/F&O tips. Report draft + family alert = control back.

Guardrails: no tips, no prediction, PII redacted, privacy-first.
Run: backend `uvicorn main:app --reload`, frontend `npm install; npm run dev`, open http://localhost:3000, backend http://localhost:8000/docs
