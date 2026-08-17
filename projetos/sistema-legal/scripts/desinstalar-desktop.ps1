# Remove atalhos do Sistema Legal do Ambiente de Trabalho e Menu Iniciar
$AppName = "Sistema Legal"
$Desktop = Join-Path ([Environment]::GetFolderPath("Desktop")) "$AppName.lnk"
$StartMenu = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs\$AppName.lnk"

Write-Host ""
Write-Host "=== Desinstalar atalhos do Sistema Legal ===" -ForegroundColor Cyan
Write-Host ""

foreach ($path in @($Desktop, $StartMenu)) {
    if (Test-Path $path) {
        Remove-Item $path -Force
        Write-Host "  Removido: $path" -ForegroundColor Green
    } else {
        Write-Host "  Nao encontrado: $path" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "Atalhos removidos. Os ficheiros do projeto mantem-se intactos." -ForegroundColor Green
Write-Host "Para parar servidores em execucao, feche as janelas 'Sistema Legal'." -ForegroundColor Yellow
Write-Host ""
