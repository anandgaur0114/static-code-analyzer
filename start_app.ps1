Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   Launching CodeAccuracy Web Studio (FastAPI + React + Vite)" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Start FastAPI Backend in background or separate window
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Yellow
$backendPython = if (Test-Path "$PSScriptRoot\backend\.venv\Scripts\python.exe") { "$PSScriptRoot\backend\.venv\Scripts\python.exe" } else { "python" }
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; & '$backendPython' -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 2

# 2. Start Vite Frontend in separate window
Write-Host "[2/2] Launching React + Vite Frontend on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Start-Sleep -Seconds 3

Write-Host "Opening web application in default browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"
