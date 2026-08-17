@echo off
cd /d "%~dp0"
echo.
echo ============================================
echo   Instalar Sistema Legal no seu PC
echo ============================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\instalar-desktop.ps1"
echo.
pause
