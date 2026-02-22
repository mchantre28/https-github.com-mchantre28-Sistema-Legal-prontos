@echo off
cd /d "%~dp0"
title Publicar no GitHub
echo.
echo ========================================
echo   PUBLICAR ALTERACOES NO GITHUB PAGES
echo ========================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0PUBLICAR-NO-GITHUB.ps1"
echo.
pause
