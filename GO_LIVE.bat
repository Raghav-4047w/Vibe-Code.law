@echo off
title Digital Evidence Locker - LIVE HOSTING
color 0E

echo.
echo ============================================================
echo   DIGITAL EVIDENCE LOCKER - PUBLIC HOSTING
echo ============================================================
echo.
echo   This will generate a PUBLIC URL for your project!
echo   Make sure you have run 'run_project.bat' first so 
echo   that your local server is running.
echo.
echo   Generating your secure public tunnel...
echo.

npx localtunnel --port 3000 --subdomain digital-evidence-locker-sih

pause
