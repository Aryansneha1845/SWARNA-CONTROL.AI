# Security audit — SWARNA-CONTROL.AI (29 Sep 2026)

Scope: FastAPI backend + Next.js frontend, solo hackathon prototype. All items below were
implemented and verified unless marked as accepted risk / future work.

## 1. Secrets & env
- [x] `backend/.env` + `frontend/.env.local` gitignored; only `.env.example` (placeholders) tracked.
- [x] Git history scanned (`git log -p`): single-commit history, no keys, tokens, or OTPs found.
- [x] Etherscan/Gemini/Groq keys live ONLY in backend server env — never in the browser bundle.
- [x] New `SWARN_API_KEY` gate: backend POST routes require `X-API-Key` when set; the browser
      never sees it (Next.js `/api/*` routes attach it server-side). Timing-safe compare.
- [!] Keys were pasted in a chat window during setup — ROTATE all three after the hackathon
      (Etherscan dashboard, AI Studio, Groq console) and treat chat logs as compromised.

## 2. Authentication & authorization
- [x] No user accounts exist, so there is nothing to escalate: no roles, no admin routes, no PII store.
- [x] "Admin" surface = `/docs`, `/redoc`, `/openapi.json` → disabled when `ENV=prod`.
- [x] Per-IP rate limits: `/investigate` 10/min, `/control-pack` + `/tts-hindi` 20/10/min, rest 30–60/min (slowapi). Verified: 11th burst request → 429.
- [ ] Full user login (Clerk/Supabase Auth free tiers) is future work — not needed while no
      user data is stored. Do NOT bolt on a client-side passcode screen (theater, not security).

## 3. Input handling (XSS / injection)
- [x] Every input sanitized server-side: HTML tags + control chars stripped, hard length caps
      (message 4000, UPI text 500, hash strictly `0x`+hex ≤66). Verified: `<script>` payload echoed back clean.
- [x] No `dangerouslySetInnerHTML`, no `eval`, no `innerHTML` anywhere in frontend (grep verified).
- [x] Tx-hash allowlist: garbage hashes fall through to the cached fixture, never to the chain APIs.
- [x] Request bodies capped (16 KB) at the Next.js proxy with 413 on overflow.

## 4. Transport & headers
- [x] CORS: explicit `FRONTEND_ORIGIN` allowlist, methods GET/POST only (was `*`). Verified no wildcard echo.
- [x] Backend security headers: nosniff, DENY framing, strict referrer, locked Permissions-Policy, restrictive CSP, HSTS in prod.
- [x] Next.js: `poweredByHeader: false`, same headers + CSP via `next.config.js`.
  Lesson learned 29 Sep: `script-src 'self'` without `'unsafe-inline'` breaks Next.js itself
  (its runtime uses inline scripts) — React never hydrates and every click dies silently.
  Fix: `'unsafe-inline'` allowed for scripts (no nonce infra), `'unsafe-eval'` dev-only for
  webpack/react-refresh. All other sources stay locked to `'self'`/none; no third-party scripts exist.
- [x] Debug/reload (`uvicorn --reload`) is dev-only (`run_backend.bat`); prod runs `ENV=prod` without reload (see below).

## 5. Dependencies
- [x] Next.js 14.2.0 → **14.2.35** (fixes Dec-2025 RCE/Image CVEs). Build green.
- [x] `npm audit`: remaining Next 14 advisories need a breaking major upgrade — accepted residual risk,
      mitigated: no `next/image` remotePatterns, no Server Actions, no middleware rewrites, no i18n.
- [x] Python: added `slowapi`; groq SDK raised to ≥1.7 (fixes httpx crash); pydantic/fastapi on current minors.
- [ ] Re-run `npm audit` + `pip install -U` before any production hosting.

## 6. Data & privacy (DPDP Act 2023)
- [x] Data minimization: only the three pasted fields are processed, solely for the requested trail.
- [x] No retention: in-memory only; 30-day max host-log note in Privacy Policy.
- [x] Explicit consent checkbox gates the TRACE button (purpose limitation + consent).
- [x] No analytics, no tracking pixels, no third-party embeds (grep verified; fonts self-hosted at build).
- [x] No cookies set → no consent banner required (audited; documented in Cookie Policy).
- [x] Privacy / Terms / Cookies / Refunds pages added + footer with organizer details + consent copy.
- [x] No passwords exist → nothing to hash (documented instead of inventing a password store).

## 7. Content honesty
- [x] No reviews, testimonials, star ratings, guarantees, or success percentages anywhere (grep verified).
- [x] Demo fixtures explicitly labeled "synthetic demo"; scam lure text framed as the scammer's words.
- [x] Risk language kept to indicator/priority/requires-review; footer + terms disclaim verdicts.
- [x] No images shipped → no alt-text or image-copyright issues possible.

## 8. Accessibility (WCAG basics)
- [x] `:focus-visible` ring globally; skip-to-form link; labelled inputs; native keyboard controls.
- [x] `aria-live="polite"` results region; clear button labels (no icon-only buttons).
- [x] `--faint` text color raised to meet ≥4.5:1 contrast on background.

## Residual risks (be honest with the jury)
1. Rate limiter is in-memory — multi-worker prod needs Redis-backed limits.
2. `SWARN_API_KEY` is a shared service key, not per-user identity — fine for a demo, not for multi-tenant prod.
3. Free-tier LLM APIs may retain prompts — never submit real victim PII; use synthetic fixtures on stage.
4. edge-tts writes temp mp3s — served path is never exposed; files stay server-local.
