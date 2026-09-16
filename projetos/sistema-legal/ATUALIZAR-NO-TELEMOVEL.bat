@echo off
chcp 65001 >nul
title Atualizar Sistema Legal no telemovel
cd /d "%~dp0"

rem Java do Android Studio (necessario para o Gradle)
if exist "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
) else if exist "%LOCALAPPDATA%\Programs\Android Studio\jbr\bin\java.exe" (
    set "JAVA_HOME=%LOCALAPPDATA%\Programs\Android Studio\jbr"
)

echo.
echo ========================================
echo  Atualizar Sistema Legal no telemovel
echo ========================================
echo.
echo 1. Ligue o telemovel por USB
echo 2. Depuracao USB activada
echo 3. Autorize este PC no telemovel se pedir
echo.
pause

echo.
echo [1/3] A copiar ficheiros para a app Android...
call npm run cap:sync
if errorlevel 1 (
    echo ERRO no cap:sync.
    pause
    exit /b 1
)

echo.
echo [2/3] A instalar no telemovel...
cd android
call gradlew.bat installDebug
set ERR=%ERRORLEVEL%
cd ..

echo.
if %ERR% neq 0 (
    echo.
    echo === Se deu erro ===
    echo - Confirme que o telemovel aparece no Android Studio
    echo - File ^> Sync Project with Gradle Files
    echo - Depois Run com o telemovel seleccionado
    echo.
    echo Erro comum: JAVA_HOME nao definido no Android Studio
    echo   File ^> Settings ^> Build ^> Gradle ^> Gradle JDK
    echo   Escolha: jbr-17 ou Embedded JDK
) else (
    echo [3/3] Instalado com sucesso no telemovel!
    echo Abra a app Sistema Legal no telemovel.
)

echo.
pause
