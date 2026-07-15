@echo off
REM Arranque completo (backend + frontend). Evita login com API vazia em localhost:3001.
cd /d "%~dp0projetos\sistema-legal"
call START-SISTEMA.bat
