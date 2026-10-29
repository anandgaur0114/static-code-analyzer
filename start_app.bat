@echo off
echo ======================================================================
echo    Launching CodeAccuracy Web Studio (FastAPI + React + Vite)
echo ======================================================================

echo [0/2] Clearing any stale processes on ports 5173 and 8000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173 "') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000 "') do taskkill /f /pid %%a >nul 2>&1

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000...
start "CodeAccuracy Backend API" cmd /k "cd /d %~dp0backend && if exist .venv\Scripts\python.exe (.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload) else (python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload)"

timeout /t 2 >nul

echo [2/2] Starting React + Vite Frontend on http://localhost:5173...
start "CodeAccuracy React Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ======================================================================
echo Both servers launched! Waiting for Vite to initialize...
echo Studio URL: http://localhost:5173
echo ======================================================================
timeout /t 5 >nul
start http://localhost:5173
