@echo off
cd /d "%~dp0projetos\sistema-legal"
title Sistema Legal - Servidor Local
echo.
echo ============================================
echo   Sistema Legal - http://localhost:8000
echo ============================================
echo.
echo A iniciar servidor...
echo O browser abrira em 5 segundos.
echo.
echo MANTENHA ESTA JANELA ABERTA.
echo Feche-a para parar o servidor.
echo ============================================
echo.
start cmd /c "timeout /t 5 /nobreak >nul && start http://localhost:8000"
npx serve -p 8000
pause
