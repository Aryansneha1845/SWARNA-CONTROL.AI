# SWARN-CONTROL.AI
**Secure Wealth And Resilience Network — Cross-rail Observation + Narrative Trace + Response & Onward Loss Lock**

> Hum chat nahi karte, hum trail reconstruct karte hain.

SANGYAN 2026 (SNTC IIT-BHU x SEBI x NSDL) — Track A + E combo.
Solo build, 4-5 hrs/day, Ethereum only, zero-cost stack.

## Live Demo
- Frontend: `https://swarna-control-ai.vercel.app`
- Backend: `https://swarn-control-backend.onrender.com` (`/health` → ok, `/docs` 404 in prod)
- Video (4-min, Praveen case): `<youtube/drive link — add after recording>`
- PPT: `SWARN-CONTROL.AI.pptx` in repo root

## One-liner
Cross-rail investigation control room: joins message + UPI payment + crypto trail into one evidence-backed timeline, with next control action in Hindi.

## What it is NOT
- Not a chatbot (no chatbox on homepage)
- Not a scam classifier (no 92% meter)
- Not an advisor (no tips, guardrail-safe)

## Structure
```
fixtures/  — 2 synthetic demo cases (Praveen main, Kavita backup)
backend/   — FastAPI: narrative, payment parse, resolve, trace, investigate
frontend/  — Next.js: Trail canvas (React Flow) + Evidence Cards + Kill Chain + Control Panel
docs/      — demo script + submission checklist
```

## Quick start (Day 0)
1. Copy `.env.example` to `backend/.env`, fill Etherscan + Gemini + Groq keys (all free, no card)
2. Backend: `cd backend; pip install -r requirements.txt; uvicorn main:app --reload`
3. Frontend: `cd frontend; npm install; npm run dev`
4. Demo flow: upload message + UPI + hash -> Trace Karo -> Trail + Evidence + Control

## Guardrails
No tips, no price prediction, no OTP/SMS harvest. PII redacted by default. LLM only for extraction/explanation, never for money math.
IP vests in NSDL on submission per T&C.
