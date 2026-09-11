@echo off
title Digital Evidence Locker - Auto Runner
color 0A

echo ============================================================
echo   DIGITAL EVIDENCE LOCKER - SIH 2026
echo   Polygon Amoy Blockchain + Gemini Vision AI
echo ============================================================
echo.

REM --- 1. Check and Install Backend Dependencies ---
if not exist "backend\venv\" (
    echo [SETUP] First time setup detected! Setting up Python environment...
    cd backend
    python -m venv venv
    call venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install fastapi uvicorn[standard] sqlalchemy python-multipart bcrypt python-dotenv google-genai web3 eth-account pymupdf reportlab spacy sumy requests pillow
    python -m spacy download en_core_web_sm
    python init_db.py
    cd ..
)

REM --- 2. Check and Install Frontend Dependencies ---
if not exist "frontend\node_modules\" (
    echo [SETUP] Installing Frontend dependencies...
    cd frontend
    npm install
    cd ..
)

REM --- 3. Check and Install Blockchain Dependencies ---
if not exist "blockchain\node_modules\" (
    echo [SETUP] Installing Blockchain dependencies...
    cd blockchain
    npm install
    cd ..
)

echo [READY] All dependencies are present.
echo.

REM --- Start Backend ---
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "Backend - FastAPI" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

REM --- Start Frontend ---
echo [2/2] Starting Next.js Frontend on http://localhost:3000 ...
start "Frontend - Next.js" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo Opening browser...
start http://localhost:3000/login

echo.
echo ============================================================
echo   APP IS RUNNING!
echo   Frontend : http://localhost:3000
echo   Backend  : http://localhost:8000
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
