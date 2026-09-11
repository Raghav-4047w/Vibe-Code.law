@echo off
title Digital Evidence Locker - Update Dependencies
color 0B

echo.
echo ============================================================
echo   DIGITAL EVIDENCE LOCKER - DEPENDENCY UPDATER
echo   Run this to force update all packages and fix missing modules.
echo ============================================================
echo.

echo [1/3] Updating Python packages...
cd backend
if not exist "venv\" (
    python -m venv venv
)
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install fastapi uvicorn[standard] sqlalchemy python-multipart bcrypt python-dotenv google-genai web3 eth-account pymupdf reportlab spacy sumy requests pillow
python -m spacy download en_core_web_sm
cd ..

echo.
echo [2/3] Updating Frontend (Next.js) packages...
cd frontend
npm install
npm update
cd ..

echo.
echo [3/3] Updating Blockchain (Hardhat) packages...
cd blockchain
npm install
npm update
cd ..

echo.
echo ============================================================
echo   UPDATE COMPLETE! Run START_APP.bat to launch the app.
echo ============================================================
echo.
pause
