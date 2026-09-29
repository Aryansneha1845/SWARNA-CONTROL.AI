@echo off
REM DEV ONLY: --reload auto-restarts on code change. Never use --reload in production.
cd /d "%~dp0backend"
if not exist .env ( copy .env.example .env & echo Created .env - fill free keys )
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
