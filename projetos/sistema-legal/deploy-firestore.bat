@echo off
cd /d "%~dp0"
echo ========================================
echo   DEPLOY FIRESTORE (regras + indices)
echo ========================================
echo.
echo Se ainda nao fizeste login, executa antes: 1-login-firebase.bat
echo.
call npx firebase use anapaulamedinasolicitadora
call npx firebase deploy --only firestore
echo.
if %ERRORLEVEL% EQU 0 (
    echo Deploy concluido com sucesso!
) else (
    echo ERRO. Executa 1-login-firebase.bat para fazeres login pela primeira vez.
)
pause
