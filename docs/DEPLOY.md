# DEPLOY — Live Demo Link (Vercel + Render, both free)

Goal: `https://<you>.vercel.app` (frontend) talking to
`https://swarn-control-backend.onrender.com` (backend) for the SANGYAN submission.

## 0. Pre-req (done)
- [x] Pushed to `https://github.com/Aryansneha1845/SWARNA-CONTROL.AI.git`
- [x] `render.yaml` blueprint in repo root
- [x] `ENV=prod` disables `/docs` (main.py) — jury sees a locked API

## 1. Backend — Render (5 min + first-build wait)
1. https://dashboard.render.com → New → Blueprint → select repo → Apply (`render.yaml`).
2. Environment → add (values from your local `backend/.env`, NEVER commit):
   - `FRONTEND_ORIGIN` = `https://<your-app>.vercel.app` (fill after step 2, then redeploy)
   - `SWARN_API_KEY` = generate: `python -c "import secrets; print(secrets.token_urlsafe(32))"` — MUST match Vercel's value
   - `ETHERSCAN_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY` = free keys (optional — app falls back to regex + cached chain without them)
3. Deploy → wait → open `https://<svc>.onrender.com/health` → expect `{"ok":true,"service":"swarn-control"}`.

## 2. Frontend — Vercel (3 min)
1. https://vercel.com → Add New → Project → Import repo → Root Directory = `frontend`.
2. Environment Variables (Production):
   - `BACKEND_URL` = `https://<svc>.onrender.com` (no trailing slash)
   - `SWARN_API_KEY` = same value as Render (server-side only, never shipped to browsers)
3. Deploy → open `https://<you>.vercel.app`.

## 3. Wire-up
1. Back in Render: set `FRONTEND_ORIGIN` to the real Vercel URL → Manual Deploy → Clear build cache → Deploy.
2. Re-test the Vercel URL end-to-end (below).

## 4. Verify (Live Demo checklist)
- [ ] `GET /health` on Render → ok
- [ ] Vercel hero loads, `AI READY` (proxy health), tutorial cards visible
- [ ] Intake → "Synthetic demo: Praveen" → consent → TRACE KARO → graph + evidence + kill chain
- [ ] CONTROL tab → Hindi summary + Chakshu/SCORES drafts
- [ ] No `/docs` on Render (404 — prod locked) ✅

## 5. Demo-day notes
- Render free sleeps after 15 min idle → cold start ~50s. Before jury/demo recording: open `/health` once to wake it, then run the Praveen trace.
- Free-tier LLM APIs may retain prompts — on stage use ONLY synthetic fixtures (Praveen/Kavita), never real victim PII.
- If Render is cold mid-demo: cached fixture path still responds once warm — never dies.

## 6. Keep-alive (so the jury never sees a cold start)
Render sleeps only when NOBODY visits. A free external pinger counts as a visitor:
1. Sign up at https://cron-job.org (free, no card) → Create cronjob.
2. Settings: URL = `https://<your-svc>.onrender.com/health`, schedule = every 10 minutes, request method GET, timeout 30s.
3. Save → it pings forever. Verify after 30 min: Render dashboard → Metrics shows periodic 200s.
4. Fallback: https://uptimerobot.com free plan (50 monitors, 5-min interval) — same URL.
5. Video recording does NOT need this — record against local backend (zero network risk).
