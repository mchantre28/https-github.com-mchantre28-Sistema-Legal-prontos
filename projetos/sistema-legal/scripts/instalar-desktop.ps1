# Instala atalhos do Sistema Legal no Ambiente de Trabalho e Menu Iniciar
$ErrorActionPreference = "Stop"

# Garantir Node.js no PATH (comum quando aberto fora do terminal)
$nodeDirs = @(
    "$env:ProgramFiles\nodejs",
    "$env:ProgramFiles(x86)\nodejs",
    "$env:LOCALAPPDATA\Programs\node"
)
foreach ($dir in $nodeDirs) {
    if ((Test-Path "$dir\npm.cmd") -and ($env:PATH -notlike "*$dir*")) {
        $env:PATH = "$dir;$env:PATH"
    }
}
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "Erro: Node.js/npm nao encontrado. Instale em https://nodejs.org e reinicie o PC." -ForegroundColor Red
    exit 1
}

$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Launcher = Join-Path $Root "SISTEMA-LEGAL-APP.bat"
$IconIco = Join-Path $Root "assets\favicon.ico"
$IconPng = Join-Path $Root "assets\logo-solicitadora.png"
$AppName = "Sistema Legal"
$CmdExe = Join-Path $env:SystemRoot "System32\cmd.exe"

if (-not (Test-Path $Launcher)) {
    Write-Host "Erro: ficheiro de arranque nao encontrado: $Launcher" -ForegroundColor Red
    exit 1
}

function Ensure-AppIcon {
    param([string]$IcoPath, [string]$PngPath)
    if (Test-Path $IcoPath) { return $IcoPath }
    if (-not (Test-Path $PngPath)) { return $null }
    try {
        Add-Type -AssemblyName System.Drawing
        $bitmap = New-Object System.Drawing.Bitmap $PngPath
        $scaled = New-Object System.Drawing.Bitmap $bitmap, 32, 32
        $handle = $scaled.GetHicon()
        $icon = [System.Drawing.Icon]::FromHandle($handle)
        $stream = [System.IO.File]::Create($IcoPath)
        $icon.Save($stream)
        $stream.Close()
        $icon.Dispose()
        $scaled.Dispose()
        $bitmap.Dispose()
        Write-Host "  Icone criado: $IcoPath" -ForegroundColor Gray
        return $IcoPath
    } catch {
        Write-Host "  AVISO: nao foi possivel criar favicon.ico ($($_.Exception.Message))" -ForegroundColor Yellow
        return $null
    }
}

$Icon = Ensure-AppIcon -IcoPath $IconIco -PngPath $IconPng
$IconIndex = $null
if (-not $Icon) {
    $Icon = Join-Path $env:SystemRoot "System32\imageres.dll"
    $IconIndex = 2
}

Write-Host ""
Write-Host "=== Instalar Sistema Legal no PC ===" -ForegroundColor Cyan
Write-Host ""

# Dependencias (backend + serve no frontend)
Write-Host "[1/3] A instalar dependencias (pode demorar na primeira vez)..." -ForegroundColor Yellow
function Install-NpmDeps($dir) {
    Push-Location $dir
    try {
        if (Test-Path "node_modules") {
            Write-Host "  Dependencias ja presentes em $dir" -ForegroundColor Gray
            return $true
        }
        if (Test-Path "package-lock.json") {
            cmd /c "npm ci >nul 2>&1"
            if ($LASTEXITCODE -ne 0) { cmd /c "npm install" }
        } else {
            cmd /c "npm install"
        }
        return (Test-Path "node_modules")
    } finally { Pop-Location }
}
$backendOk = Install-NpmDeps (Join-Path $Root "backend")
$frontendOk = Install-NpmDeps $Root
if (-not $backendOk) {
    Write-Host "  AVISO: dependencias do backend incompletas. Se o arranque falhar, execute 'npm install' na pasta backend." -ForegroundColor Yellow
}
if (-not $frontendOk) {
    Write-Host "  AVISO: dependencias do frontend incompletas. Execute 'npm install' na pasta do projeto." -ForegroundColor Yellow
}

Write-Host "[2/3] A criar atalhos..." -ForegroundColor Yellow
$Wsh = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")
$StartMenu = Join-Path ([Environment]::GetFolderPath("StartMenu")) "Programs"
$ShortcutPaths = @(
    (Join-Path $Desktop "$AppName.lnk"),
    (Join-Path $StartMenu "$AppName.lnk")
)

foreach ($path in $ShortcutPaths) {
    $sc = $Wsh.CreateShortcut($path)
    $sc.TargetPath = $CmdExe
    $sc.Arguments = "/c `"`"$Launcher`"`""
    $sc.WorkingDirectory = $Root
    $sc.Description = "Sistema Legal - Gestao Juridica"
    if ($IconIndex) {
        $sc.IconLocation = "$Icon,$IconIndex"
    } elseif (Test-Path $Icon) {
        $sc.IconLocation = "$Icon,0"
    }
    $sc.Save()
    Write-Host "  Criado: $path" -ForegroundColor Green
}

Write-Host "[3/3] Concluido!" -ForegroundColor Green
Write-Host ""
Write-Host "Como usar:" -ForegroundColor Cyan
Write-Host "  - Clique em 'Sistema Legal' no Ambiente de Trabalho ou Menu Iniciar" -ForegroundColor White
Write-Host "  - Mantenha a janela preta aberta enquanto usa a aplicacao" -ForegroundColor White
Write-Host "  - Para remover: execute DESINSTALAR-DESKTOP.bat" -ForegroundColor White
Write-Host ""
