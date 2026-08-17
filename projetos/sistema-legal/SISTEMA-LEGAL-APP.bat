@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Sistema Legal

REM Garantir Node.js no PATH
if not exist "%ProgramFiles%\nodejs\npm.cmd" (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)
set "PATH=%ProgramFiles%\nodejs;%PATH%"

echo.
echo ============================================
echo   Sistema Legal
echo   A iniciar... (mantenha esta janela aberta)
echo ============================================
echo.

set "BACKEND_UP=0"
for /f "tokens=*" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do set "BACKEND_UP=1"

if "!BACKEND_UP!"=="1" goto backend_already_up

echo [..] A iniciar backend...
start "Sistema Legal - Backend" /MIN "%~dp0scripts\iniciar-backend.bat"
echo [..] A aguardar backend (ate 20s)...
set /a WAIT=0

:wait_backend
timeout /t 1 /nobreak >nul
set /a WAIT+=1
set "BACKEND_UP=0"
for /f "tokens=*" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do set "BACKEND_UP=1"
if "!BACKEND_UP!"=="1" goto backend_ready
if !WAIT! LSS 20 goto wait_backend
echo [AVISO] Backend ainda nao responde. Verifique a janela "Sistema Legal - Backend".
goto start_frontend

:backend_ready
echo [OK] Backend disponivel.
goto start_frontend

:backend_already_up
echo [OK] Backend ja a correr na porta 3001.

:start_frontend
echo [..] A abrir Sistema Legal...
start "" "%~dp0scripts\abrir-app-mode.bat"

echo [..] Frontend na porta 8000...
echo.
echo Para fechar: feche esta janela e a janela do backend.
echo.
npx serve -l 8000 -c serve.json .
