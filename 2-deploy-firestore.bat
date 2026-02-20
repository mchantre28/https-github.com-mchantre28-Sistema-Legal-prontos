@echo off
cd /d "%~dp0"
echo ========================================
echo   DEPLOY FIRESTORE (regras + indices)
echo ========================================
echo.
call npx firebase use anapaulamedinasolicitadora
call npx firebase deploy --only firestore
echo.
if %ERRORLEVEL% EQU 0 (
    echo.
    echo *** Deploy concluido com sucesso! ***
) else (
    echo.
    echo *** ERRO ***
    echo Se apareceu "permission denied" ou "not logged in",
    echo executa primeiro: 1-login-firebase.bat
)
echo.
pause
