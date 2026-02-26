# PUBLICAR ALTERACOES NO GITHUB PAGES
# Copia os ficheiros atualizados e faz push para o GitHub
# As alteracoes aparecerao no website em 1-3 minutos

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$origem = $PSScriptRoot
$expRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$prontos = Join-Path $expRoot "prontos-temp"

# Ficheiros para deploy (incluir todos os necessarios)
$ficheiros = @(
    "index.html",
    "script.js",
    "logo-data.js",
    "styles.css",
    "logo.png",
    "firebase.js",
    "manifest.json",
    "ABRIR-SISTEMA.bat",
    "icon.svg"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  PUBLICAR SISTEMA LEGAL NO GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $prontos)) {
    Write-Host "A pasta prontos-temp nao existe." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "OPCAO A - Publicar a partir do repo principal:" -ForegroundColor Cyan
    Write-Host "  1. Abra o terminal no Cursor (Ctrl+`)" -ForegroundColor White
    Write-Host "  2. Execute:" -ForegroundColor White
    Write-Host "     cd c:\experiencia" -ForegroundColor Gray
    Write-Host "     git add projetos/sistema-legal/" -ForegroundColor Gray
    Write-Host "     git status" -ForegroundColor Gray
    Write-Host "     git commit -m 'Atualizar Sistema Legal'" -ForegroundColor Gray
    Write-Host "     git push origin main" -ForegroundColor Gray
    Write-Host ""
    Write-Host "OPCAO B - Usar repo separado para GitHub Pages:" -ForegroundColor Cyan
    Write-Host "  cd c:\experiencia" -ForegroundColor Gray
    Write-Host "  git clone https://github.com/mchantre28/https-github.com-mchantre28-Sistema-Legal-prontos.git prontos-temp" -ForegroundColor Gray
    Write-Host "  Depois execute novamente este script." -ForegroundColor Gray
    Write-Host ""
    exit 1
}

foreach ($f in $ficheiros) {
    $src = Join-Path $origem $f
    $dst = Join-Path $prontos $f
    if (Test-Path $src) {
        Copy-Item $src $dst -Force
        Write-Host "  OK $f" -ForegroundColor Green
    }
}

Push-Location $prontos
git add -A
$status = git status --short
if ($status) {
    Write-Host ""
    Write-Host "Ficheiros alterados:" -ForegroundColor Yellow
    git status --short
    Write-Host ""
    git commit -m "Atualizar Sistema Legal - sincronizar alteracoes locais"
    git push origin main
    Write-Host ""
    Write-Host "PUBLICADO COM SUCESSO!" -ForegroundColor Green
    Write-Host ""
    Write-Host "O website sera atualizado em 1-3 minutos." -ForegroundColor Cyan
    Write-Host "URL: https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Nenhuma alteracao para enviar. Os ficheiros ja estao atualizados." -ForegroundColor Yellow
    Write-Host ""
}
Pop-Location
