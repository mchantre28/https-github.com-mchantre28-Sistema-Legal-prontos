# Arranque completo: backend (:3001) + frontend (:8000)
Set-Location $PSScriptRoot

Write-Host "Sistema Legal — arranque completo" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:8000/index.html" -ForegroundColor Green
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Green

$backendUp = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
if (-not $backendUp) {
    Write-Host "A iniciar backend..." -ForegroundColor Yellow
    Start-Process cmd -ArgumentList '/k', "cd /d `"$PSScriptRoot\backend`" && (npm ci 2>nul || npm install) && npm run seed && npm start" -WindowStyle Normal
    $deadline = (Get-Date).AddSeconds(15)
    while ((Get-Date) -lt $deadline) {
        Start-Sleep -Seconds 1
        $backendUp = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue
        if ($backendUp) { break }
    }
    if (-not $backendUp) {
        Write-Host "AVISO: backend ainda nao responde na porta 3001. Verifique a janela do backend." -ForegroundColor Red
    }
} else {
    Write-Host "Backend ja a correr na porta 3001." -ForegroundColor Gray
}

Start-Job -ScriptBlock { Start-Sleep 3; Start-Process "http://localhost:8000/index.html" } | Out-Null
Write-Host "A iniciar frontend (Ctrl+C para parar)..." -ForegroundColor Cyan
npx serve -l 8000 -c serve.json .
