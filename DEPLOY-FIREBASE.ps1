# Deploy Firestore Rules e Indexes - Sistema Legal
# Requer: Firebase CLI instalado (npm install -g firebase-tools)
# E: firebase login (uma vez)

$ErrorActionPreference = "Stop"
$projRoot = $PSScriptRoot

Write-Host "=== Deploy Firestore (Rules + Indexes) ===" -ForegroundColor Cyan
Write-Host ""

# 1. Usar npx firebase (firebase-tools local)
$fb = "npx"
$fbArgs = @("firebase")

# 2. Associar projeto e deploy
Push-Location $projRoot
try {
    & $fb @fbArgs use anapaulamedinasolicitadora 2>$null
    Write-Host "A fazer deploy das regras e indices..." -ForegroundColor Green
    & $fb @fbArgs deploy --only firestore
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Deploy concluido com sucesso." -ForegroundColor Green
    } else {
        Write-Host "Erro no deploy. Execute 'npx firebase login' se ainda nao fez login." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Erro: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
