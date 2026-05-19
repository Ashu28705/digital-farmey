@echo off
REM Digital Farming Advisory System - Start Backend Server
REM Windows Batch Script

echo.
echo ========================================
echo  AgriAdvisor Backend Server Launcher
echo ========================================
echo.

cd backend

echo Checking if Node.js is installed...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed!
    echo Please install from: https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found

echo.
echo Checking MongoDB...
echo Ensure MongoDB is running (mongod)
echo.

echo Starting server...
echo.

node server.js

pause
