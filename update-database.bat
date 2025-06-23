@echo off
echo 🔄 CEE Lab Equipment Database Update
echo ====================================
echo.
echo This will add new fields (Model, FIU ID) to your database
echo.
pause
echo.
echo Running database update...
node update-database.js
echo.
echo Database update completed!
pause
