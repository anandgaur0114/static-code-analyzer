@echo off
echo ======================================================================
echo    Launching CodeAccuracy Web Studio (FastAPI + React + Vite)
echo ======================================================================

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
start "CodeAccuracy Backend API" cmd /k "cd /d %~dp0backend && if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload) else (python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload)"

timeout /t 2 >nul

echo [2/2] Starting React + Vite Frontend on http://localhost:5173...
start "CodeAccuracy React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo Both servers launched successfully!
echo Open your browser at: http://localhost:5173
echo ======================================================================
timeout /t 4
start http://localhost:5173
