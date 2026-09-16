# Cria a keystore de release (uma vez). Guarde as passwords num local seguro.
# Uso: .\scripts\create-keystore.ps1
# A password APARECE no ecra para evitar erros de digitacao.

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Android = Join-Path $Root "android"
$KeyDir = Join-Path $Android "keystore"
$Keystore = Join-Path $KeyDir "sistema-legal-release.keystore"
$Props = Join-Path $Android "release-signing.properties"

New-Item -ItemType Directory -Force -Path $KeyDir | Out-Null

Get-ChildItem $KeyDir -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

$keytool = $null
$candidates = @(
    "$env:LOCALAPPDATA\Programs\Android Studio\jbr\bin\keytool.exe",
    "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe",
    "$env:JAVA_HOME\bin\keytool.exe"
)
foreach ($c in $candidates) {
    if ($c -and (Test-Path $c)) { $keytool = $c; break }
}
if (-not $keytool) {
    $cmd = Get-Command keytool -ErrorAction SilentlyContinue
    if ($cmd) { $keytool = $cmd.Source }
}
if (-not $keytool) {
    Write-Error "keytool nao encontrado. Instale Android Studio ou defina JAVA_HOME."
}

Write-Host ""
Write-Host "== Criar keystore Sistema Legal ==" -ForegroundColor Cyan
Write-Host "A password VAI APARECER no ecra (mais facil)." -ForegroundColor Yellow
Write-Host "Tem de ter pelo menos 6 caracteres." -ForegroundColor Yellow
Write-Host "ANOTA a password - se a perderes, nao podes actualizar a app na Play Store." -ForegroundColor Yellow
Write-Host ""

$pass1 = Read-Host "Escreve a password"
$pass2 = Read-Host "Escreve a MESMA password outra vez"

if ($pass1 -ne $pass2) {
    Write-Host ""
    Write-Host "ERRO: as duas passwords nao sao iguais. Corre o script outra vez." -ForegroundColor Red
    exit 1
}
if ([string]::IsNullOrWhiteSpace($pass1) -or $pass1.Length -lt 6) {
    Write-Host ""
    Write-Host "ERRO: a password tem de ter pelo menos 6 caracteres. Corre o script outra vez." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "A criar keystore..." -ForegroundColor Yellow

& $keytool -genkeypair -v `
  -keystore $Keystore `
  -alias sistema-legal `
  -keyalg RSA -keysize 2048 -validity 10000 `
  -storetype PKCS12 `
  -storepass $pass1 `
  -keypass $pass1 `
  -dname "CN=Sistema Legal, OU=Solicitadoria, O=Ana Paula Medina, L=Portugal, C=PT"

if ($LASTEXITCODE -ne 0 -or -not (Test-Path $Keystore)) {
    Write-Host "ERRO: keystore nao foi criada." -ForegroundColor Red
    exit 1
}

$propsContent = @(
    "storeFile=../keystore/sistema-legal-release.keystore"
    "storePassword=$pass1"
    "keyAlias=sistema-legal"
    "keyPassword=$pass1"
) -join "`r`n"
[System.IO.File]::WriteAllText($Props, $propsContent)

Write-Host ""
Write-Host "OK - Keystore criada com sucesso." -ForegroundColor Green
Write-Host "Ficheiro: $Keystore"
Write-Host "Seguinte comando: .\scripts\build-release.ps1"
Write-Host ""
