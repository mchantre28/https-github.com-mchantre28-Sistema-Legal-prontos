@echo off
cd /d "%~dp0"
echo.
echo === Sistema Legal - Servidor Local ===
echo.
echo A iniciar servidor em http://localhost:8000
echo.
echo Mantenha esta janela aberta. Feche para parar o servidor.
echo.
start http://localhost:8000
npx serve -p 8000
pause
