@echo off
TITLE Course Buddy Launcher
COLOR 0A

echo ===================================================
echo      Starting Course Buddy Library System...
echo ===================================================
echo.

:: Step 1: Start the Python Backend
echo [1/3] Starting Python Backend Server...
cd backend\scripts

:: Check for virtual environment. If missing, create it and install packages.
if not exist "venv\" (
    echo      First-time setup: Installing Python dependencies...
    python -m venv venv
    call venv\Scripts\activate
    pip install fastapi uvicorn pandas supabase python-dotenv python-multipart openpyxl xlsxwriter
) else (
    call venv\Scripts\activate
)

:: Start the backend in a separate minimized window
start "CourseBuddy Backend" /MIN cmd /c "uvicorn main:app --host 127.0.0.1 --port 8000"
cd ..\..

:: Step 2: Start the React Frontend
echo [2/3] Starting React Frontend Server...

:: Check for node_modules. If missing, install them.
if not exist "node_modules\" (
    echo      First-time setup: Installing Node.js dependencies...
    npm install
)

:: Start the frontend in a separate minimized window
start "CourseBuddy Frontend" /MIN cmd /c "npm run dev"

:: Step 3: Wait for servers to boot, then open the browser
echo [3/3] Waiting for servers to initialize...
timeout /t 5 /nobreak > NUL

echo Opening Course Buddy in your default web browser...
start http://localhost:3000

echo.
echo ===================================================
echo SYSTEM IS LIVE!
echo Important: To shut down the system, close the two 
echo minimized command prompt windows on your taskbar.
echo ===================================================
pause