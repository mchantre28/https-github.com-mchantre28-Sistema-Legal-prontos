@echo off
set "URL=http://localhost:8000/index.html"

timeout /t 3 /nobreak >nul

where msedge >nul 2>&1
if %errorlevel%==0 (
    start "" msedge --app=%URL% --window-size=1280,800
    exit /b 0
)

where chrome >nul 2>&1
if %errorlevel%==0 (
    start "" chrome --app=%URL% --window-size=1280,800
    exit /b 0
)

start "" %URL%
