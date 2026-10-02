@echo off
setlocal
title SWARN-CONTROL.AI - Frontend (Next.js :3000)

cd /d "%~dp0frontend"

REM 1. Node check
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] 'node' not found on PATH. Install Node.js LTS (20/22+) and re-open this window.
  pause
  exit /b 1
)
where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] 'npm' not found on PATH. Reinstall Node.js LTS with npm included.
  pause
  exit /b 1
)
node --version
call npm --version

REM 2. Env check (server-side proxy only; browser never sees BACKEND_URL/SWARN_API_KEY)
if not exist .env.local (
  echo [WARN] frontend\.env.local missing. Create it with:
  echo   BACKEND_URL=http://localhost:8000
  echo   SWARN_API_KEY=^<same value as backend\.env SWARN_API_KEY^>
)

REM 3. Install deps only if node_modules is missing (saves minutes on every launch)
if not exist node_modules (
  echo [INFO] node_modules missing - running npm install (one-time, may take a few minutes) ...
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed. Try: npm cache clean --force, then re-run. If EACCES/EPERM, close editors and retry as normal user.
    pause
    exit /b 1
  )
) else (
  echo [INFO] node_modules present - skipping npm install. Delete the folder to force reinstall.
)

REM 4. Port check
netstat -ano 2>nul | findstr /C:":3000 " | findstr /C:"LISTENING" >nul
if not errorlevel 1 (
  echo [WARN] Port 3000 is already in use. Stop the other app or open the running one: http://localhost:3000
)

REM 5. Backend hint (Next.js /api/* proxies to this)
echo [INFO] Expecting backend at http://localhost:8000/health - start run_backend.bat in a second window if not running.

echo [INFO] Starting Next.js dev server ...
call npm run dev

echo.
echo [INFO] Server stopped with exit code %errorlevel%.
pause
