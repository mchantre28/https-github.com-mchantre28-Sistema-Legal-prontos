# Script de Segurança - Sistema Legal
# Use este script para garantir que está trabalhando no projeto correto

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   SISTEMA LEGAL - Modo Seguro" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se estamos na pasta correta
$pastaAtual = Get-Location
if ($pastaAtual.Path -like "*sistema-legal*") {
    Write-Host "[OK] Voce esta na pasta correta!" -ForegroundColor Green
    Write-Host "    Pasta: $pastaAtual" -ForegroundColor White
} else {
    Write-Host "[ERRO] Voce NAO esta na pasta sistema-legal!" -ForegroundColor Red
    Write-Host "    Pasta atual: $pastaAtual" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Corrigindo..." -ForegroundColor Yellow
    
    # Tentar navegar para a pasta correta
    if (Test-Path "projetos\sistema-legal") {
        Set-Location "projetos\sistema-legal"
        Write-Host "[OK] Navegado para projetos\sistema-legal" -ForegroundColor Green
    } elseif (Test-Path "..\sistema-legal") {
        Set-Location "..\sistema-legal"
        Write-Host "[OK] Navegado para ..\sistema-legal" -ForegroundColor Green
    } else {
        Write-Host "[ERRO] Pasta sistema-legal nao encontrada!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Arquivos do Projeto:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

# Listar arquivos principais
Get-ChildItem -File | Where-Object { $_.Extension -eq ".html" } | ForEach-Object {
    if ($_.Name -eq "index_clean.html") {
        Write-Host "  [*] $($_.Name) <- ARQUIVO PRINCIPAL" -ForegroundColor Yellow
    } else {
        Write-Host "  [-] $($_.Name)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Comandos Uteis:" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Abrir arquivo principal:" -ForegroundColor White
Write-Host "    code index_clean.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Ver status do Git:" -ForegroundColor White
Write-Host "    git status" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Fazer commit apenas deste projeto:" -ForegroundColor White
Write-Host "    git add projetos/sistema-legal/" -ForegroundColor Cyan
Write-Host "    git commit -m 'Sistema Legal: [descricao]'" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "[OK] Pronto para trabalhar!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan

