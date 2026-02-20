# Script de Verificação de Funcionalidade - Sistema Legal
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  VERIFICACAO DE FUNCIONALIDADE" -ForegroundColor Green
Write-Host "  Sistema Legal" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$arquivo = "index_clean.html"
$erros = @()
$avisos = @()
$sucessos = @()

# 1. Verificar se o arquivo existe
Write-Host "[1] Verificando se o arquivo principal existe..." -ForegroundColor Yellow
if (Test-Path $arquivo) {
    $sucessos += "Arquivo principal encontrado: $arquivo"
    Write-Host "  [OK] Arquivo encontrado" -ForegroundColor Green
} else {
    $erros += "Arquivo principal nao encontrado: $arquivo"
    Write-Host "  [ERRO] Arquivo nao encontrado!" -ForegroundColor Red
    exit 1
}

# 2. Verificar funções principais
Write-Host ""
Write-Host "[2] Verificando funcoes principais..." -ForegroundColor Yellow

$funcoes = @(
    "fecharModalRobusto",
    "fecharModal",
    "editarClienteDireto",
    "excluirClienteDireto",
    "editarContratoDireto",
    "excluirContratoDireto",
    "editarHonorarioDireto",
    "excluirHonorarioDireto",
    "editarHerancaDireto",
    "excluirHerancaDireto",
    "editarMigracaoDireto",
    "excluirMigracaoDireto",
    "editarRegistoDireto",
    "excluirRegistoDireto",
    "carregarSecao",
    "mostrarNotificacao"
)

$conteudo = Get-Content $arquivo -Raw

foreach ($funcao in $funcoes) {
    if ($conteudo -match "function $funcao\s*\(" -or $conteudo -match "const $funcao\s*=" -or $conteudo -match "let $funcao\s*=") {
        $sucessos += "Funcao encontrada: $funcao"
        Write-Host "  [OK] $funcao" -ForegroundColor Green
    } else {
        $erros += "Funcao nao encontrada: $funcao"
        Write-Host "  [ERRO] $funcao NAO ENCONTRADA" -ForegroundColor Red
    }
}

# 3. Verificar se fecharModalRobusto protege a sidebar
Write-Host ""
Write-Host "[3] Verificando protecao da sidebar..." -ForegroundColor Yellow

if ($conteudo -match "div\.id !== 'sidebar'" -or $conteudo -match "!div\.classList\.contains\('sidebar'\)") {
    $sucessos += "Sidebar protegida em fecharModalRobusto"
    Write-Host "  [OK] Sidebar protegida" -ForegroundColor Green
} else {
    $avisos += "Sidebar pode nao estar protegida"
    Write-Host "  [AVISO] Verificar protecao da sidebar" -ForegroundColor Yellow
}

# 4. Verificar se botões estão protegidos
Write-Host ""
Write-Host "[4] Verificando protecao dos botoes..." -ForegroundColor Yellow

if ($conteudo -match "el\.tagName !== 'BUTTON'" -or $conteudo -match "el\.id !== 'mobileMenuBtn'") {
    $sucessos += "Botoes protegidos em fecharModalRobusto"
    Write-Host "  [OK] Botoes protegidos" -ForegroundColor Green
} else {
    $avisos += "Botoes podem nao estar protegidos"
    Write-Host "  [AVISO] Verificar protecao dos botoes" -ForegroundColor Yellow
}

# 5. Verificar referências a excluirHonorarioDireto
Write-Host ""
Write-Host "[5] Verificando referencias a excluirHonorarioDireto..." -ForegroundColor Yellow

$referencias = ([regex]::Matches($conteudo, "excluirHonorarioDireto")).Count
if ($referencias -gt 0) {
    if ($conteudo -match "function excluirHonorarioDireto\s*\(") {
        $sucessos += "Funcao excluirHonorarioDireto encontrada ($referencias referencias)"
        Write-Host "  [OK] Funcao encontrada com $referencias referencias" -ForegroundColor Green
    } else {
        $erros += "excluirHonorarioDireto referenciada mas nao definida"
        Write-Host "  [ERRO] Funcao referenciada mas nao definida!" -ForegroundColor Red
    }
} else {
    $avisos += "Nenhuma referencia a excluirHonorarioDireto encontrada"
    Write-Host "  [AVISO] Nenhuma referencia encontrada" -ForegroundColor Yellow
}

# 6. Verificar erros de sintaxe básicos
Write-Host ""
Write-Host "[6] Verificando erros de sintaxe basicos..." -ForegroundColor Yellow

$linhas = Get-Content $arquivo
$linhaNum = 0
foreach ($linha in $linhas) {
    $linhaNum++
    # Verificar parênteses não fechados em linhas importantes
    if ($linhaNum -lt 100) {
        $abertos = ([regex]::Matches($linha, "\(")).Count
        $fechados = ([regex]::Matches($linha, "\)")).Count
        if ($abertos - $fechados -gt 2 -and $linha.Length -gt 200) {
            $avisos += "Possivel erro de sintaxe na linha $linhaNum"
        }
    }
}
Write-Host "  [OK] Verificacao basica concluida" -ForegroundColor Green

# 7. Verificar se window.excluirHonorarioDireto está definido
Write-Host ""
Write-Host "[7] Verificando atribuicao global..." -ForegroundColor Yellow

if ($conteudo -match "window\.excluirHonorarioDireto\s*=") {
    $sucessos += "Funcao atribuida globalmente (window.excluirHonorarioDireto)"
    Write-Host "  [OK] Funcao atribuida globalmente" -ForegroundColor Green
} else {
    $avisos += "Funcao pode nao estar atribuida globalmente"
    Write-Host "  [AVISO] Verificar atribuicao global" -ForegroundColor Yellow
}

# 8. Verificar estrutura de projetos
Write-Host ""
Write-Host "[8] Verificando estrutura de projetos..." -ForegroundColor Yellow

$pastas = @(
    "projetos\sistema-legal",
    "projetos\loja-variada",
    "projetos\solicitadora",
    "projetos\backend-api"
)

foreach ($pasta in $pastas) {
    if (Test-Path "..\$pasta") {
        $sucessos += "Pasta encontrada: $pasta"
        Write-Host "  [OK] $pasta" -ForegroundColor Green
    } else {
        $avisos += "Pasta nao encontrada: $pasta"
        Write-Host "  [AVISO] $pasta" -ForegroundColor Yellow
    }
}

# RESUMO
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  RESUMO DA VERIFICACAO" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[SUCESSOS]: $($sucessos.Count)" -ForegroundColor Green
Write-Host "[AVISOS]: $($avisos.Count)" -ForegroundColor Yellow
Write-Host "[ERROS]: $($erros.Count)" -ForegroundColor Red
Write-Host ""

if ($erros.Count -eq 0) {
    Write-Host "[OK] NENHUM ERRO ENCONTRADO!" -ForegroundColor Green
    Write-Host "Sistema parece estar funcional." -ForegroundColor White
} else {
    Write-Host "[ERRO] $($erros.Count) ERRO(S) ENCONTRADO(S)!" -ForegroundColor Red
    Write-Host ""
    foreach ($erro in $erros) {
        Write-Host "  - $erro" -ForegroundColor Red
    }
}

if ($avisos.Count -gt 0) {
    Write-Host ""
    Write-Host "[AVISOS]:" -ForegroundColor Yellow
    foreach ($aviso in $avisos) {
        Write-Host "  - $aviso" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan

