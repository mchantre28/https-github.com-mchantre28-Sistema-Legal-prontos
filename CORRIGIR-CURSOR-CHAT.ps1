# =============================================================================
# CORREÇÃO: Chat do Cursor travado em "Loading chat"
# =============================================================================
# Execute este script APÓS fechar o Cursor completamente
# Execute como: powershell -ExecutionPolicy Bypass -File "CORRIGIR-CURSOR-CHAT.ps1"
# =============================================================================

$ErrorActionPreference = "Stop"
$storagePath = "$env:APPDATA\Cursor\User\globalStorage"
$backupPath = "$env:APPDATA\Cursor\User\globalStorage\backup-chats-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Correcao do Chat do Cursor" -ForegroundColor Cyan
Write-Host "  (Loading chat forever)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o Cursor está rodando
$cursorProcess = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
if ($cursorProcess) {
    Write-Host "[AVISO] O Cursor esta rodando!" -ForegroundColor Yellow
    Write-Host "        Feche o Cursor completamente e execute este script novamente." -ForegroundColor Yellow
    Write-Host ""
    $resposta = Read-Host "Deseja fechar o Cursor agora? (S/N)"
    if ($resposta -eq 'S' -or $resposta -eq 's') {
        Stop-Process -Name "Cursor" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
        Write-Host "[OK] Cursor fechado." -ForegroundColor Green
    } else {
        Write-Host "Abortando. Feche o Cursor e execute novamente." -ForegroundColor Red
        exit 1
    }
}

# Verificar se a pasta existe
if (-not (Test-Path $storagePath)) {
    Write-Host "[ERRO] Pasta nao encontrada: $storagePath" -ForegroundColor Red
    Write-Host "       O Cursor esta instalado corretamente?" -ForegroundColor Red
    exit 1
}

Write-Host "[1/5] Criando pasta de backup..." -ForegroundColor Gray
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Backup dos arquivos atuais
Write-Host "[2/5] Fazendo backup dos arquivos..." -ForegroundColor Gray

$filesToBackup = @("state.vscdb", "state.vscdb.backup")
foreach ($file in $filesToBackup) {
    $fullPath = Join-Path $storagePath $file
    if (Test-Path $fullPath) {
        Copy-Item $fullPath -Destination (Join-Path $backupPath $file) -Force
        Write-Host "      Backup: $file" -ForegroundColor DarkGray
    }
}

# Procurar arquivo corrompido
$corruptedFile = Get-ChildItem -Path $storagePath -Filter "state.vscdb.corrupted.*" -ErrorAction SilentlyContinue | 
    Sort-Object Length -Descending | 
    Select-Object -First 1

$stateDbPath = Join-Path $storagePath "state.vscdb"
$backupDbPath = Join-Path $storagePath "state.vscdb.backup"

Write-Host "[3/5] Verificando arquivos..." -ForegroundColor Gray

$fixApplied = $false

# Estratégia 1: Restaurar do arquivo corrompido (contém os chats mais recentes)
if ($corruptedFile) {
    Write-Host "      Encontrado: $($corruptedFile.Name) ($([math]::Round($corruptedFile.Length/1MB, 2)) MB)" -ForegroundColor DarkGray
    Write-Host "[4/5] Restaurando a partir do arquivo corrompido (seus chats estao aqui)..." -ForegroundColor Gray
    
    if (Test-Path $stateDbPath) {
        Rename-Item $stateDbPath "$stateDbPath.old" -Force
    }
    Copy-Item $corruptedFile.FullName -Destination $stateDbPath -Force
    $fixApplied = $true
    Write-Host "      [OK] state.vscdb restaurado!" -ForegroundColor Green
}
# Estratégia 2: Se não tem corrompido, tentar do backup
elseif (Test-Path $backupDbPath) {
    Write-Host "      Usando state.vscdb.backup como alternativa..." -ForegroundColor DarkGray
    Write-Host "[4/5] Restaurando a partir do backup..." -ForegroundColor Gray
    
    if (Test-Path $stateDbPath) {
        Rename-Item $stateDbPath "$stateDbPath.old" -Force
    }
    Copy-Item $backupDbPath -Destination $stateDbPath -Force
    $fixApplied = $true
    Write-Host "      [OK] state.vscdb restaurado do backup!" -ForegroundColor Green
}
else {
    Write-Host "      Nenhum arquivo de recuperacao encontrado." -ForegroundColor Yellow
    Write-Host "[4/5] Criando state.vscdb limpo..." -ForegroundColor Gray
    
    if (Test-Path $stateDbPath) {
        Rename-Item $stateDbPath "$stateDbPath.old" -Force
    }
    # Cursor criará um novo ao iniciar
    $fixApplied = $true
    Write-Host "      [OK] Pronto para reiniciar com database limpo." -ForegroundColor Green
}

Write-Host "[5/5] Concluido!" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Correcao aplicada com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backup salvo em:" -ForegroundColor Cyan
Write-Host "  $backupPath" -ForegroundColor White
Write-Host ""
Write-Host "  Agora abra o Cursor novamente." -ForegroundColor Yellow
Write-Host ""
Read-Host "Pressione Enter para sair"
