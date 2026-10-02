@echo off
setlocal
title SWARN-CONTROL.AI - Backend (FastAPI :8000)
REM DEV ONLY: --reload auto-restarts on code change. Never use --reload in production (see run_prod.bat).

cd /d "%~dp0backend"

REM 1. Python check (same interpreter is pinned below via `python -m`)
where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] 'python' not found on PATH. Install Python 3.12/3.13 and tick "Add to PATH".
  pause
  exit /b 1
)
python --version

REM 2. .env check (never commit real keys; .env is gitignored)
if not exist .env (
  if exist .env.example (
    copy /Y .env.example .env >nul
    echo [INFO] Created backend\.env from .env.example - fill free keys: ETHERSCAN_API_KEY, GEMINI_API_KEY, GROQ_API_KEY.
  ) else (
    echo [ERROR] backend\.env and backend\.env.example both missing.
    pause
    exit /b 1
  )
)

REM 3. Install deps only if FastAPI/uvicorn import fails (saves minutes on every launch).
REM NOTE: `python -m pip` (not bare `pip`) pins the same interpreter that owns site-packages.
REM Bare pip/uvicorn can resolve to a different Python (3.12 vs 3.13) and crash with ModuleNotFoundError. Do not change these lines.
python -c "import fastapi, uvicorn, slowapi" >nul 2>nul
if errorlevel 1 (
  echo [INFO] Python deps missing - installing requirements.txt ...
  python -m pip install -r requirements.txt
  if errorlevel 1 (
    echo [ERROR] pip install failed. Try: python -m pip install --upgrade pip, then re-run.
    pause
    exit /b 1
  )
) else (
  echo [INFO] Python deps OK - skipping pip install. Delete a package or run "python -m pip install -r requirements.txt" manually to force reinstall.
)

REM 4. Port check
netstat -ano 2>nul | findstr /C:":8000 " | findstr /C:"LISTENING" >nul
if not errorlevel 1 (
  echo [WARN] Port 8000 is already in use. Stop the other server or reuse it: http://127.0.0.1:8000/health
)

echo [INFO] Starting FastAPI dev server ...
echo [INFO] Health: http://127.0.0.1:8000/health  Docs: http://127.0.0.1:8000/docs
python -m uvicorn main:app --reload --port 8000

echo.
echo [INFO] Server stopped with exit code %errorlevel%.
pause
