@echo off
title Bright English Demo Launcher
cd /d "%~dp0"

echo [1/3] Khoi dong Backend Server (port 3001)...
start "Backend API" cmd /k "node server/index.js"

echo [2/3] Khoi dong Frontend Vite (port 5173)...
start "Frontend Vite" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Khoi dong Cloudflare Tunnel...
echo Dang lay link cong khai cho khach xem...
cloudflared tunnel --url http://localhost:5173

pause
