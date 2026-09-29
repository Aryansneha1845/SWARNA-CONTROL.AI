@echo off
REM Production: no reload, docs disabled. Set ENV=prod and real FRONTEND_ORIGIN in backend\.env first.
cd /d "%~dp0backend"
set ENV=prod
uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1
