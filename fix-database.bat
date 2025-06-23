@echo off
echo 🔧 CEE Lab Equipment Database Fix
echo =================================
echo.
echo This will add Model and FIU ID columns to your database
echo.
pause
echo.
echo Running database fix...
node fix-database.js
echo.
echo Fix completed! Press any key to continue...
pause
