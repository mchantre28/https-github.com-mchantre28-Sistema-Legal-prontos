@echo off
setlocal
cd /d "%~dp0..\backend"

if not exist "%ProgramFiles%\nodejs\npm.cmd" (
    echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
    pause
    exit /b 1
)
set "PATH=%ProgramFiles%\nodejs;%PATH%"

(call npm ci 2>nul || call npm install)
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias do backend.
    pause
    exit /b 1
)
call npm run seed
call npm start
