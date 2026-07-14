@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Sistema Legal - Backend + Frontend

echo.
echo ============================================
echo   Sistema Legal - Arranque completo
echo   Frontend: http://localhost:8000/index.html
echo   Backend:  http://localhost:3001
echo ============================================
echo.
echo MANTENHA ESTA JANELA ABERTA (frontend).
echo O backend corre noutra janela.
echo.

set "BACKEND_UP=0"
for /f "tokens=*" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do set "BACKEND_UP=1"

if "!BACKEND_UP!"=="1" (
    echo [OK] Backend ja a correr na porta 3001.
) else (
    echo [..] A iniciar backend na porta 3001...
    start "Sistema Legal - Backend" cmd /k "cd /d "%~dp0backend" && (call npm ci 2>nul || call npm install) && call npm run seed && call npm start"
    echo [..] A aguardar backend (ate 15s)...
    set /a WAIT=0
    :wait_backend
    timeout /t 1 /nobreak >nul
    set /a WAIT+=1
    set "BACKEND_UP=0"
    for /f "tokens=*" %%a in ('netstat -ano ^| findstr ":3001" ^| findstr "LISTENING"') do set "BACKEND_UP=1"
    if "!BACKEND_UP!"=="1" goto backend_ready
    if !WAIT! LSS 15 goto wait_backend
    echo [AVISO] Backend ainda nao responde na porta 3001. Verifique a janela "Sistema Legal - Backend".
    goto start_frontend
    :backend_ready
    echo [OK] Backend disponivel em http://localhost:3001
)

:start_frontend
echo.
echo [..] A iniciar frontend na porta 8000...
echo [..] O browser abrira em http://localhost:8000/index.html
echo.
start cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:8000/index.html"
npx serve -l 8000 -c serve.json .
pause
