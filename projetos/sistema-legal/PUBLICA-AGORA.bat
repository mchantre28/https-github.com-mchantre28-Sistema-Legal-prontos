@echo off
cd /d "%~dp0"
title Publicar no GitHub
echo.
echo ========================================
echo   PUBLICAR ALTERACOES NO GITHUB PAGES
echo ========================================
echo.

cd ..\..
git add projetos/sistema-legal/
git status
echo.
set /p conf="Fazer commit e push? (S/N): "
if /i "%conf%" neq "S" (
    echo Cancelado.
    pause
    exit /b 0
)
git commit -m "Atualizar Sistema Legal - ultimas alteracoes"
git push origin main
echo.
echo ========================================
echo   CONCLUIDO!
echo ========================================
echo.
echo O website sera atualizado em 1-3 minutos.
echo Se o GitHub Pages usa outro repositorio, execute: .\PUBLICAR-NO-GITHUB.ps1
echo.
pause
