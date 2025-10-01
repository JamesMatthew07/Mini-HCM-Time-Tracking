@echo off
echo Starting Mini HCM Time Tracking Servers...
start "Backend Server" cmd /k npm run backend
timeout /t 3
start "Frontend Server" cmd /k npm run dev
echo.
echo Servers started in separate windows!
echo Close those windows to stop the servers.
