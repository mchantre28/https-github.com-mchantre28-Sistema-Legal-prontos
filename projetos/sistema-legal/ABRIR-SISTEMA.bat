@echo off
cd /d "%~dp0"
title Sistema Legal - Servidor Local
echo.
echo ============================================
echo   Sistema Legal - http://localhost:8000
echo ============================================
echo.
echo A iniciar servidor...
echo O browser abrirá em breve.
echo.
echo MANTENHA ESTA JANELA ABERTA.
echo Feche-a para parar o servidor.
echo ============================================
echo.
timeout /t 3 /nobreak >nul
start http://localhost:8000
npx serve -p 8000
pause
