@echo off
REM Celio E-commerce Windows Startup Script

echo 🚀 Starting Celio E-commerce Application...
echo.

REM Check if .env exists
if not exist ".env" (
    echo ❌ .env file not found!
    echo Please copy .env.example to .env and configure your settings:
    echo    copy .env.example .env
    echo.
    echo Then edit .env file with your database URL and API keys.
    echo.
    pause
    exit /b 1
)

REM Check if built
if not exist "dist" (
    echo 📦 Building application first...
    call npm run build
    if errorlevel 1 (
        echo ❌ Build failed!
        pause
        exit /b 1
    )
)

echo ✅ Starting server...
echo 📖 Open http://localhost:5000 in your browser
echo.
echo 👨‍💼 Default admin login:
echo    Email: admin@celio.com  
echo    Password: admin123
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the application
node dist/index.js

pause