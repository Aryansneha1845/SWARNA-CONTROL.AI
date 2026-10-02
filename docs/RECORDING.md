# RECORDING — 4-min demo video, local machine, zero installs

You already have everything: **Xbox Game Bar** (built into Windows, verified
installed) + `run_backend.bat` + `run_frontend.bat`. No OBS, no account, no face
or voice needed — the app's own Hindi TTS is the narrator.

## 0. Setup (5 min, once)
1. Double-click `run_backend.bat` → wait for `Uvicorn running on http://127.0.0.1:8000`.
2. Double-click `run_frontend.bat` → wait for `ready on http://localhost:3000`.
3. Browser: open `http://localhost:3000`, press F11 (fullscreen), zoom 125%
   (Ctrl + +) so jury can read on 720p.
4. Recorder: press **Win + G** → pin the Capture widget → close overlay.
   Record shortcut: **Win + Alt + R** (a small timer appears). Stop: same keys.
   Files land in `Videos/Captures/*.mp4`.
5. Audio: Game Bar captures system sound by default → the app's Hindi TTS
   (CONTROL tab speaker button) gets recorded. No mic needed. Test once:
   open any trace → CONTROL → play Hindi → Win+Alt+R 5 sec → stop → play file.

## 1. Rehearse once (no recording)
Run the Praveen flow end-to-end so clicks are muscle memory:
`Commission` → `Synthetic demo: Praveen` → tick consent → `TRACE KARO` →
click UPI→on-ramp edge → right panel EVIDENCE → timeline play → CONTROL tab →
Hindi speaker button. If any step lags, re-run — cold Python imports are the
only slow part, and only on the first trace after boot.

## 2. Record (4 min, follow docs/DEMO_SCRIPT.md)
| Time | Do | Say/show (Hindi captions ok) |
|---|---|---|
| 0:00–0:30 | Hero screen. Scroll the 3 what-it-does cards slowly. | "Praveen, 22, Ranchi. Telegram pe 50k double ka message." Show fixtures: message + UPI text side by side. |
| 0:30–1:10 | Intake: click Praveen preset → consent → TRACE KARO. | Entities highlight (UPI, phone, URL auto-marked). |
| 1:10–2:30 | Graph: MESSAGE → UPI 12:41 → ON-RAMP 12:58 → wallets. Click the UPI→on-ramp edge → Evidence Card. Press timeline play. | "17 min gap + amount match = Supported." Show rail filter ALL → CRYPTO. |
| 2:30–3:30 | Kill Chain 6/7 ✓. CONTROL tab → press Hindi speaker → let it play. | Subtitles/captions on. Chakshu + SCORES drafts visible. |
| 3:30–4:00 | `/docs` is 404? No — show `http://127.0.0.1:8000/docs` Swagger (local dev has docs). End on hero. | "Deterministic rules for money, LLM only for words. Hum scam nahi batate, control wapas dete hain." |

Rules: synthetic fixtures ONLY (never real victim data). No chatbox, no 92%
meter, no tips — the app has none, so just don't claim any.

## 3. Finish (10 min)
1. Trim start/end in Clipchamp (built into Windows) or Photos → Video Editor.
2. Export 720p (1280×720) — keeps file small for upload.
3. Upload **Unlisted** to YouTube (or Drive, link-sharing on) → copy link.
4. Send the link here → README + slide 10 get filled + final push → submit
   all three links (live demo + video + PPT) on the SANGYAN form.

## 4. If something breaks mid-take
- Trace slow first time → normal (imports). Just re-record that segment.
- Backend 500 → check the `run_backend.bat` window for the traceback, paste it here.
- Don't debug on camera: stop, fix, re-record from the nearest section start
  and splice in Clipchamp.
