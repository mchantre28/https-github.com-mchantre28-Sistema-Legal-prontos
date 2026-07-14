# Abre o Sistema Legal em http://localhost:8000
# Execute este script e mantenha a janela aberta

$pasta = $PSScriptRoot
Set-Location $pasta

Write-Host "A iniciar servidor..." -ForegroundColor Cyan
Write-Host "Abra no browser: http://localhost:8000/index.html" -ForegroundColor Green
Write-Host "Mantenha esta janela aberta. Ctrl+C para parar." -ForegroundColor Yellow
Write-Host ""

Start-Job -ScriptBlock { Start-Sleep 2; Start-Process "http://localhost:8000/index.html" } | Out-Null
npx serve -l 8000 -c serve.json .
