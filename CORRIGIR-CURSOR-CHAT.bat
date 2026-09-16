@echo off
title Corrigir Chat do Cursor - Loading Forever
echo.
echo Fechando o Cursor para aplicar a correcao...
taskkill /IM "Cursor.exe" /F 2>nul
timeout /t 2 /nobreak >nul
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0CORRIGIR-CURSOR-CHAT.ps1"
pause
