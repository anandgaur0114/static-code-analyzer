@echo off
echo ========================================================
echo Starting FastAPI Backend (C++ Static Code Analyzer)
echo ========================================================
cd /d "%~dp0backend"
if exist .venv\Scripts\python.exe (
    .venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
) else (
    python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
)
pause
