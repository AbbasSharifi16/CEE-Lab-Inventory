@echo off
echo 🔄 CEE Lab Equipment Data Migration
echo ===================================
echo.
echo This will migrate data from data.js to equipment.db
echo.
pause
echo.
echo Running migration...
node migrate-data.js
echo.
echo Migration completed!
pause
