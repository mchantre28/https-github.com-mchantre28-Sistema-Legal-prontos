@echo off
chcp 65001 >nul
title Abrir Sistema Legal no Android Studio
echo.
echo A procurar Android Studio...
echo.

set "STUDIO="
if exist "C:\Program Files\Android\Android Studio\bin\studio64.exe" set "STUDIO=C:\Program Files\Android\Android Studio\bin\studio64.exe"
if exist "C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe" set "STUDIO=C:\Program Files (x86)\Android\Android Studio\bin\studio64.exe"
if exist "%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe" set "STUDIO=%LOCALAPPDATA%\Programs\Android Studio\bin\studio64.exe"

if not defined STUDIO (
    echo [ERRO] Android Studio nao encontrado neste PC.
    echo.
    echo Instale em: https://developer.android.com/studio
    echo Depois execute este ficheiro outra vez.
    echo.
    echo Enquanto isso, pode testar no telemovel pelo browser:
    echo https://mchantre28.github.io/https-github.com-mchantre28-Sistema-Legal-prontos/index.html
    echo.
    pause
    exit /b 1
)

echo Encontrado: %STUDIO%
echo A abrir projeto: android\
echo.
start "" "%STUDIO%" "%~dp0android"
echo.
echo Quando abrir:
echo   1. Espere o Gradle terminar
echo   2. Escolha Pixel 10a no topo
echo   3. Clique no triangulo verde RUN  ou  Shift+F10
echo.
pause
