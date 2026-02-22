# Inicia servidor local e abre o Sistema Legal no browser
Set-Location $PSScriptRoot

Write-Host "A iniciar servidor em http://localhost:8000 ..." -ForegroundColor Cyan
Write-Host "O browser abrirá automaticamente. Prima Ctrl+C para parar o servidor." -ForegroundColor Gray

# Abre o browser após 2 segundos (em background)
Start-Job -ScriptBlock { Start-Sleep 2; Start-Process "http://localhost:8000" } | Out-Null

# Inicia o servidor (bloqueia até Ctrl+C)
npx serve -p 8000
