# Build release AAB — Sistema Legal (Capacitor Android)
# Uso: .\scripts\build-release.ps1
# Requer: release-signing.properties em android/ (ver PLAY-STORE.md)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

Write-Host "== Sistema Legal — build release AAB ==" -ForegroundColor Cyan

# JAVA_HOME — Android Studio JBR (bundled JDK)
if (-not $env:JAVA_HOME) {
    $jbrCandidates = @(
        "$env:LOCALAPPDATA\Programs\Android Studio\jbr",
        "C:\Program Files\Android\Android Studio\jbr",
        "C:\Program Files (x86)\Android\Android Studio\jbr"
    )
    foreach ($jbr in $jbrCandidates) {
        if (Test-Path "$jbr\bin\java.exe") {
            $env:JAVA_HOME = $jbr
            Write-Host "JAVA_HOME: $jbr"
            break
        }
    }
}
if (-not $env:JAVA_HOME) {
    Write-Error "JAVA_HOME nao definido. Instale Android Studio ou defina JAVA_HOME manualmente."
}

$signingFile = Join-Path $Root "android\release-signing.properties"
if (-not (Test-Path $signingFile)) {
    Write-Warning "Falta android\release-signing.properties — o AAB sera gerado SEM assinatura de release."
    Write-Warning "Copie android\release-signing.properties.example e configure a keystore (ver PLAY-STORE.md)."
}

Write-Host "`n1/3 — cap sync (www -> android)..." -ForegroundColor Yellow
npm run cap:sync
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n2/3 — bundleRelease..." -ForegroundColor Yellow
Push-Location (Join-Path $Root "android")
try {
    & .\gradlew.bat bundleRelease
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} finally {
    Pop-Location
}

$aab = Join-Path $Root "android\app\build\outputs\bundle\release\app-release.aab"
Write-Host "`n3/3 — Concluido." -ForegroundColor Green
if (Test-Path $aab) {
    Write-Host "AAB: $aab" -ForegroundColor Green
} else {
    Write-Warning "AAB nao encontrado no caminho esperado. Verifique a saida do Gradle."
}
