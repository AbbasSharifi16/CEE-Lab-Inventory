@echo off
echo 🗑️  Clear All Equipment Data
echo ===========================
echo.
echo ⚠️  WARNING: This will DELETE ALL equipment data!
echo.
echo This action will:
echo - Remove all equipment records from database
echo - Reset ID counter to start from 1
echo - Keep database structure intact
echo.
echo 💾 Make sure you have a backup if needed!
echo.
pause
echo.
echo Clearing all equipment data...
node clear-equipment.js
echo.
echo Clear operation completed!
pause
