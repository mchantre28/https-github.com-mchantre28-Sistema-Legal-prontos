# Sincroniza sistema-legal com o repositório prontos no GitHub
# Executar a partir de: projetos\sistema-legal\
# Ou: cd C:\experiencia\projetos\sistema-legal; .\SINCRONIZAR-PARA-PRONTOS.ps1

$origem = "C:\experiencia\projetos\sistema-legal"
$prontos = "C:\experiencia\prontos-temp"

# Ficheiros principais para deploy
$ficheiros = @(
    "index.html",
    "script.js",
    "styles.css",
    "firebase.js",
    "manifest.json",
    "README.md",
    "FIRESTORE-ESTRUTURA.md",
    "FIRESTORE-ESTRUTURA-COMPLETA.md",
    "inicializar-firestore.html",
    "seed-firestore-colecoes.js",
    "GUIA-APP-CHECK.md",
    "CONFIGURAR-APP-CHECK.html"
)

Write-Host "Sincronizando Sistema Legal para prontos..." -ForegroundColor Cyan

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
    git commit -m "Sync: atualizar Sistema Legal"
    git push origin main
    Write-Host "Push concluido!" -ForegroundColor Green
} else {
    Write-Host "Nenhuma alteracao para enviar." -ForegroundColor Yellow
}
Pop-Location
