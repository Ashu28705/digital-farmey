@echo off
REM AgriAdvisor - System Verification Script
REM Checks if all prerequisites are installed

echo.
echo ========================================
echo  AgriAdvisor - System Verification
echo ========================================
echo.

REM Check Node.js
echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js NOT found
    echo   Download: https://nodejs.org/
) else (
    echo ✅ Node.js found
    node --version
)

echo.

REM Check npm
echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm NOT found
) else (
    echo ✅ npm found
    npm --version
)

echo.

REM Check Python (optional but recommended)
echo Checking Python (for frontend server)...
python --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  Python NOT found (optional)
    echo   But you can use Node.js http-server instead
) else (
    echo ✅ Python found
    python --version
)

echo.

REM Check if node_modules exists in backend
echo Checking backend dependencies...
if exist "backend\node_modules" (
    echo ✅ Backend dependencies installed
) else (
    echo ⚠️  Backend dependencies NOT installed
    echo   Run: cd backend ^&^& npm install
)

echo.

REM Check if .env exists
echo Checking backend configuration...
if exist "backend\.env" (
    echo ✅ .env file found
) else (
    echo ⚠️  .env file NOT found
    echo   Create from .env.example or create new one
)

echo.

REM Check if MongoDB is mentioned in .env
if exist "backend\.env" (
    echo Checking MongoDB connection...
    findstr /I "MONGO" "backend\.env" >nul
    if errorlevel 1 (
        echo ❌ MONGO_URI not set in .env
    ) else (
        echo ✅ MONGO_URI configured
    )
) else (
    echo ⚠️  Cannot check MONGO_URI (no .env file)
)

echo.
echo ========================================
echo  Verification Complete
echo ========================================
echo.
echo Next Steps:
echo 1. If all checks passed (✅), you're ready to start!
echo 2. Run: start_backend_dev.bat
echo 3. In another terminal: start_frontend.bat
echo 4. Open browser to http://localhost:8000
echo.

pause
