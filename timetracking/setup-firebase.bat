@echo off
echo ========================================
echo Firebase Deployment Setup
echo ========================================
echo.

echo Step 1: Installing Firebase CLI...
call npm install -g firebase-tools
if errorlevel 1 (
    echo Error: Failed to install Firebase CLI
    pause
    exit /b 1
)
echo ✓ Firebase CLI installed
echo.

echo Step 2: Logging in to Firebase...
call firebase login
if errorlevel 1 (
    echo Error: Firebase login failed
    pause
    exit /b 1
)
echo ✓ Logged in to Firebase
echo.

echo Step 3: Installing Functions dependencies...
cd functions
call npm install
if errorlevel 1 (
    echo Error: Failed to install functions dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Functions dependencies installed
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .firebaserc and add your Firebase project ID
echo 2. Run: npm run build
echo 3. Run: firebase deploy
echo.
echo Or use the quick deploy script: npm run deploy
echo.
pause
