@echo off
REM Digital Farming Advisory System - Start Frontend Server
REM Windows Batch Script

echo.
echo ========================================
echo  AgriAdvisor Frontend Server Launcher
echo ========================================
echo.

echo Checking if Python is installed...
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed!
    echo Trying Node.js http-server instead...
    
    npx http-server -p 8000
    if errorlevel 1 (
        echo ❌ Neither Python nor Node.js http-server found!
        echo.
        echo You can:
        echo 1. Install Python from https://www.python.org/
        echo 2. Or use Node.js: npm install -g http-server
        echo 3. Or simply open index.html in your browser
        pause
        exit /b 1
    )
) else (
    echo ✅ Python found
    echo.
    echo Starting frontend server on http://localhost:8000
    echo Press Ctrl+C to stop.
    echo.
    python -m http.server 8000
)

pause
