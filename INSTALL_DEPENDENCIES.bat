@echo off
title Digital Evidence Locker - Install Dependencies
color 0A

echo.
echo ============================================================
echo   DIGITAL EVIDENCE LOCKER - DEPENDENCY INSTALLER
echo   SIH 2026 - Polygon Amoy Blockchain Edition
echo ============================================================
echo.

REM ?? Check Python ??????????????????????????????????????????????
python --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python not found! Install Python 3.11+ from https://python.org
    pause
    exit /b 1
)
echo [OK] Python found

REM ?? Check Node.js ?????????????????????????????????????????????
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js not found! Install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
echo [OK] Node.js found

echo.
echo [1/4] Creating Python virtual environment...
cd backend
python -m venv venv
call venv\Scripts\activate.bat

echo.
echo [2/4] Installing Python dependencies...
pip install --upgrade pip
pip install fastapi uvicorn[standard] sqlalchemy python-multipart bcrypt python-dotenv
pip install google-genai web3 eth-account pymupdf reportlab spacy sumy
python -m spacy download en_core_web_sm
pip install requests pillow

echo.
echo [3/4] Seeding database with default users...
python init_db.py

cd ..\frontend

echo.
echo [4/4] Installing Node.js / Next.js dependencies...
npm install

cd ..\blockchain
echo [4b] Installing Hardhat / Blockchain dependencies...
npm install

cd ..

echo.
echo ============================================================
echo   ALL DONE! Run START_APP.bat to launch the application.
echo ============================================================
echo.
echo Default Login Credentials:
echo   Officer  : DL-POL-2024-8842  / password
echo   Analyst  : DEL-FSL-09        / password
echo   Judge    : DL-CT-N001        / password
echo.
pause
