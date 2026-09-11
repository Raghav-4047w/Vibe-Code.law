@echo off
title Digital Evidence Locker - Update Dependencies
color 0B

echo.
echo ============================================================
echo   DIGITAL EVIDENCE LOCKER - DEPENDENCY UPDATER
echo   Run this once in a while to keep everything fresh
echo ============================================================
echo.

echo [1/3] Updating Python packages...
cd backend
call venv\Scripts\activate.bat
pip install --upgrade pip
pip install --upgrade fastapi uvicorn[standard] sqlalchemy python-multipart bcrypt python-dotenv
pip install --upgrade google-genai web3 eth-account pymupdf reportlab spacy sumy
pip install --upgrade requests pillow
cd ..

echo.
echo [2/3] Updating Frontend (Next.js) packages...
cd frontend
npm update
cd ..

echo.
echo [3/3] Updating Blockchain (Hardhat) packages...
cd blockchain
npm update
cd ..

echo.
echo ============================================================
echo   UPDATE COMPLETE! Run START_APP.bat to launch the app.
echo ============================================================
echo.
pause
