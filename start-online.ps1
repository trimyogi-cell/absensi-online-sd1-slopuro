$ErrorActionPreference = "SilentlyContinue"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Aplikasi Absensi SD N 1 Slopuro - ONLINE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Kill old processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# Start Node server
Write-Host "[1/2] Starting server..." -ForegroundColor Yellow
$nodeProc = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $scriptDir -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 2

# Check server
try {
    $r = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Server running on port 3000" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Server failed to start!" -ForegroundColor Red
    exit 1
}

# Start Cloudflare Tunnel
Write-Host "[2/2] Starting Cloudflare Tunnel..." -ForegroundColor Yellow
$cf = "$env:LOCALAPPDATA\npm-cache\_npx\*\node_modules\cloudflared\bin\cloudflared.exe"
$cfPath = Get-Item $cf -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty FullName

if ($cfPath) {
    $outputFile = Join-Path $scriptDir "tunnel-url.txt"
    Start-Process $cfPath -ArgumentList "tunnel","--url","http://localhost:3000" -RedirectStandardOutput $outputFile -WindowStyle Hidden
    Start-Sleep -Seconds 12
    
    $url = Get-Content $outputFile -ErrorAction SilentlyContinue | Select-String "trycloudflare" | ForEach-Object { ($_ -split '\|')[1].Trim() }
    
    if ($url) {
        Write-Host ""
        Write-Host "============================================" -ForegroundColor Green
        Write-Host "  APLIKASI ONLINE AKTIF!" -ForegroundColor Green
        Write-Host "============================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "  URL: $url" -ForegroundColor White
        Write-Host ""
        Write-Host "  Login: admin / admin123" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  Buka URL di browser/HP untuk mengakses" -ForegroundColor Cyan
        Write-Host "============================================" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Tunnel started but URL not found in log" -ForegroundColor Yellow
        Write-Host "Check: $outputFile" -ForegroundColor Yellow
    }
} else {
    Write-Host "[WARN] cloudflared not found. Install: npx --yes cloudflared" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Tekan Ctrl+C untuk menghentikan server." -ForegroundColor Gray

# Keep running
try {
    while ($true) { Start-Sleep -Seconds 60 }
} finally {
    Write-Host "Stopping server..." -ForegroundColor Yellow
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
    Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force
}
