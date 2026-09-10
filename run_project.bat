@echo off
color 0B
echo =========================================================
echo       DIGITAL EVIDENCE LOCKER - SYSTEM LAUNCHER
echo =========================================================
echo.

echo [1/3] Terminating any existing ghost processes...
taskkill /F /IM node.exe >nul 2>&1
taskkill /F /IM python.exe >nul 2>&1
timeout /T 2 /NOBREAK >nul
echo.

echo [2/3] Booting Python Backend (FastAPI)...
start "Evidence Backend" cmd /c "title Backend Server && cd backend && uvicorn main:app --reload --host 0.0.0.0 --port 8000"
echo   - Backend booting on http://localhost:8000
echo.

echo [3/3] Booting Next.js Frontend...
start "Evidence Frontend" cmd /c "title Frontend Server && cd frontend && npm run dev"
echo   - Frontend booting on http://localhost:3000
echo.

echo Waiting 5 seconds for systems to come online...
timeout /T 5 /NOBREAK >nul

echo Opening default browser...
start http://localhost:3000

echo.
echo =========================================================
echo   ALL SYSTEMS ONLINE
echo   - Swagger API Docs: http://localhost:8000/docs
echo   - Application UI:   http://localhost:3000
echo =========================================================
echo Keep the two new terminal windows open to keep the servers running.
echo Press any key to exit this launcher...
pause >nul
exit
