@echo off
REM DEV ONLY: --reload auto-restarts on code change. Never use --reload in production.
cd /d "%~dp0backend"
if not exist .env ( copy .env.example .env & echo Created .env - fill free keys )
pip install -r requirements.txt
REM NOTE: `python -m` (not bare `uvicorn`) pins the same interpreter that owns
REM site-packages. Bare uvicorn can resolve to a different Python (3.12 vs 3.13)
REM and crash with ModuleNotFoundError. Do not change this line.
python -m uvicorn main:app --reload --port 8000
