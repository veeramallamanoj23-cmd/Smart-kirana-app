@echo off
title Smart Kirana - Enterprise Secure Development Server
cd /d "%~dp0"
set "PATH=%~dp0.tools\node-v20.18.0-win-x64;%~dp0.tools\git\cmd;%PATH%"

echo ==============================================================
echo 🛡️  SMART KIRANA — DEFENSE-IN-DEPTH APPLICATION ENGINE
echo ==============================================================
echo [1/2] Launching Backend Security Server (Port 5000)...
start "Smart Kirana Security API" cmd /c "node server/index.js"

timeout /t 2 /nobreak >nul

echo [2/2] Launching React Frontend (Port 3000)...
start "" http://localhost:3000
npm run dev
pause
