@echo off
cd /d "%~dp0"
echo ========================================
echo   LOGIN FIREBASE (apenas uma vez)
echo ========================================
echo.
echo Isto vai abrir o browser para fazeres login.
echo Usa a conta Google do projeto anapaulamedinasolicitadora.
echo.
pause
call npx firebase login
echo.
echo Se o login foi bem sucedido, podes fechar esta janela.
pause
