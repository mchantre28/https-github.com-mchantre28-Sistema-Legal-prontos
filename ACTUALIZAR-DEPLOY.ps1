# Actualiza _deploy_github com os ficheiros actuais
# Depois copie o conteudo de _deploy_github para o GitHub

$ErrorActionPreference = 'Stop'
$pasta = $PSScriptRoot
$deploy = Join-Path $pasta '_deploy_github'

if (-not (Test-Path $deploy)) {
    New-Item -ItemType Directory -Path $deploy | Out-Null
}

$ficheiros = @('index.html', 'script.js', 'styles.css', 'ana.jpg')
foreach ($f in $ficheiros) {
    $origem = Join-Path $pasta $f
    if (Test-Path $origem) {
        Copy-Item $origem (Join-Path $deploy $f) -Force
        Write-Host "  OK $f" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "  Pronto! Pasta _deploy_github actualizada." -ForegroundColor Green
Write-Host "  Copie o conteudo para o GitHub. Convidado: Ctrl+Shift+R ao abrir o link." -ForegroundColor Yellow
Write-Host ""

explorer $deploy
