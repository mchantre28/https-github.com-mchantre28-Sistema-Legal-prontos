# Script para Preparar o Sistema Legal para Partilha Profissional
# Executar este script antes de fazer upload para GitHub/Netlify/etc.

Write-Host "🚀 Preparando Sistema Legal para Partilha Profissional..." -ForegroundColor Cyan
Write-Host ""

# Verificar se o arquivo existe
$arquivoOrigem = "index_clean.html"
$arquivoDestino = "index.html"

if (-not (Test-Path $arquivoOrigem)) {
    Write-Host "❌ Erro: Arquivo '$arquivoOrigem' não encontrado!" -ForegroundColor Red
    Write-Host "   Certifique-se de estar na pasta 'projetos/sistema-legal/'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Arquivo encontrado: $arquivoOrigem" -ForegroundColor Green

# Criar cópia como index.html
try {
    Copy-Item -Path $arquivoOrigem -Destination $arquivoDestino -Force
    Write-Host "✅ Arquivo criado: $arquivoDestino" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao criar arquivo: $_" -ForegroundColor Red
    exit 1
}

# Verificar tamanho do arquivo
$tamanho = (Get-Item $arquivoDestino).Length / 1MB
Write-Host "📦 Tamanho do arquivo: $([math]::Round($tamanho, 2)) MB" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Preparação concluída!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Fazer upload de '$arquivoDestino' para GitHub/Netlify/Vercel" -ForegroundColor White
Write-Host "   2. Ativar GitHub Pages / Deploy no Netlify" -ForegroundColor White
Write-Host "   3. Partilhar o link gerado" -ForegroundColor White
Write-Host ""
Write-Host "📖 Consulte 'GUIA-PARTILHA-PROFISSIONAL.md' para mais detalhes" -ForegroundColor Cyan
Write-Host ""

# Perguntar se quer abrir o arquivo
$abrir = Read-Host "Deseja abrir o arquivo no navegador? (S/N)"
if ($abrir -eq "S" -or $abrir -eq "s") {
    Start-Process $arquivoDestino
}

