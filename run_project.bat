@echo off
title Digital Evidence Locker - SIH 2026
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
    cd ..
)

echo [1/3] Verifying Backend Python packages...
cd backend
call venv\Scripts\activate.bat
python -m pip install --upgrade pip >nul 2>&1
pip install -r requirements.txt >nul 2>&1
python -m spacy download en_core_web_sm >nul 2>&1
python init_db.py >nul 2>&1
cd ..

REM --- 2. Check and Install Frontend Dependencies ---
echo [2/3] Verifying Frontend Node modules...
cd frontend
if not exist "node_modules\" (
    echo Installing Next.js dependencies...
    npm install
) else (
    REM Just update quickly if any new packages were added
    npm install --no-audit --no-fund >nul 2>&1
)
cd ..

REM --- 3. Check and Install Blockchain Dependencies ---
echo [3/3] Verifying Blockchain modules...
cd blockchain
if not exist "node_modules\" (
    echo Installing Blockchain dependencies...
    npm install
) else (
    npm install --no-audit --no-fund >nul 2>&1
)
cd ..

echo [READY] All dependencies are present.
echo.

REM --- Start Backend ---
echo [*] Starting FastAPI Backend on http://localhost:8000 ...
start "Backend - FastAPI" cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

REM --- Start Frontend ---
echo [*] Starting Next.js Frontend on http://localhost:3000 ...
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
