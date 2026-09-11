@echo off
title Digital Evidence Locker - Starting...
color 0A

echo.
echo ============================================================
echo   DIGITAL EVIDENCE LOCKER - SIH 2026
echo   Polygon Amoy Blockchain + Gemini Vision AI
echo ============================================================
echo.

REM ?? Start Backend ?????????????????????????????????????????????
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
cd backend
start "Backend - FastAPI" cmd /k "call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"
cd ..

REM ?? Wait 3 seconds for backend to init ????????????????????????
timeout /t 3 /nobreak >nul

REM ?? Start Frontend ????????????????????????????????????????????
echo [2/2] Starting Next.js Frontend on http://localhost:3000 ...
cd frontend
start "Frontend - Next.js" cmd /k "npm run dev"
cd ..

REM ?? Wait 5 seconds then open browser ?????????????????????????
timeout /t 5 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:3000/login

echo.
echo ============================================================
echo   APP IS RUNNING!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
echo   API Docs : http://localhost:8000/docs
echo.
echo   Login Credentials:
echo     Officer  : DL-POL-2024-8842  / password
echo     Analyst  : DEL-FSL-09        / password
echo     Judge    : DL-CT-N001        / password
echo.
echo   Close the two black windows to stop the app.
echo ============================================================
echo.
pause
