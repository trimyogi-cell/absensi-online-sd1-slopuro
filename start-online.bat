@echo off
echo ============================================
echo   Aplikasi Absensi SD N 1 Slopuro - ONLINE
echo ============================================
echo.

cd /d "%~dp0"

echo [1/2] Starting server...
node server.js &
timeout /t 3 >nul

echo [2/2] Starting Cloudflare Tunnel...
echo.
echo ============================================
echo   TUNNEL URL (akan muncul di bawah):
echo ============================================
echo.
npx --yes cloudflared tunnel --url http://localhost:3000

pause
