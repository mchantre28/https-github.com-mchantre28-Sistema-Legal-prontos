@echo off
cd /d "%~dp0.."
echo A gerar fatura de exemplo...
echo (pode demorar alguns segundos na primeira vez)
call npm run billing:example
echo.
if exist "billing\exemplo-fatura.pdf" (
    echo Fatura gerada: billing\exemplo-fatura.pdf
    start "" "billing\exemplo-fatura.pdf"
) else (
    echo Nao foi possivel gerar o PDF. Verifica os erros acima.
)
pause
