@echo off
cd /d "%~dp0"
REM Arranque completo: backend (:3001) + frontend (:8000)
call "%~dp0START-SISTEMA.bat"
