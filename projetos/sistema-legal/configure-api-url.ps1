# Configura a meta tag api-base-url nos 3 HTML do Sistema Legal.
# Uso: .\configure-api-url.ps1 -Url "https://sua-api.up.railway.app"

param(
    [Parameter(Mandatory = $true)]
    [string]$Url
)

$ErrorActionPreference = 'Stop'

$Url = $Url.Trim().TrimEnd('/')
if ($Url -notmatch '^https?://') {
    Write-Error "URL inválido. Use HTTPS, ex.: https://sua-api.up.railway.app"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$files = @('index.html', 'admin.html', 'cliente.html')
$metaLine = "    <meta name=`"api-base-url`" content=`"$Url`">"

$commentPattern = '(?s)\s*<!--\s*\r?\n\s*PRODUÇÃO — após deploy do backend no Railway:.*?</meta>\s*\r?\n\s*-->'
$activePattern = '<meta\s+name="api-base-url"\s+content="[^"]*"\s*>'

$updated = 0
foreach ($name in $files) {
    $path = Join-Path $scriptDir $name
    if (-not (Test-Path $path)) {
        Write-Warning "Ficheiro não encontrado: $path"
        continue
    }

    $content = Get-Content -Path $path -Raw -Encoding UTF8
    $newContent = $content

    if ($content -match $commentPattern) {
        $newContent = [regex]::Replace($content, $commentPattern, "`n$metaLine`n")
    }
    elseif ($content -match $activePattern) {
        $newContent = [regex]::Replace($content, $activePattern, $metaLine.TrimStart())
    }
    else {
        $headClose = $newContent.IndexOf('</head>')
        if ($headClose -lt 0) {
            Write-Warning "Não foi possível localizar </head> em $name"
            continue
        }
        $newContent = $newContent.Insert($headClose, "`n$metaLine`n")
    }

    if ($newContent -ne $content) {
        Set-Content -Path $path -Value $newContent -Encoding UTF8 -NoNewline
        Write-Host "OK: $name -> $Url"
        $updated++
    }
    else {
        Write-Host "Sem alterações: $name"
    }
}

if ($updated -eq 0) {
    Write-Warning "Nenhum ficheiro foi alterado."
    exit 1
}

Write-Host ""
Write-Host "Concluído. Próximo passo:"
Write-Host "  git add projetos/sistema-legal/index.html projetos/sistema-legal/admin.html projetos/sistema-legal/cliente.html"
Write-Host "  git commit -m `"Configurar api-base-url para produção`""
Write-Host "  git push origin main"
