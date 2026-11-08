@echo off
title Grapnel - LAN File Server
cd /d "%~dp0"

echo =============================================================
echo        ⚓ GRAPNEL LAN FILE SERVER INITIALIZER                 
echo =============================================================
echo.

if not exist "node_modules\" (
    echo [!] Node modules missing. Running npm install...
    call npm install
    echo.
)

echo [*] Starting Grapnel Server & Client...
echo [*] Server will be available at: http://localhost:3000
echo [*] Check terminal output for your Phone LAN IP link!
echo.

:: Automatically open browser after 3 seconds
start "" timeout /t 3 /nobreak >nul & start http://localhost:3000

call npm run dev
pause
