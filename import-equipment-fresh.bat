@echo off
echo 🗑️  CEE Lab Equipment - FRESH IMPORT
echo ====================================
echo.
echo ⚠️  WARNING: This will DELETE ALL existing equipment data!
echo.
echo This will:
echo 1. Clear all existing equipment from database
echo 2. Import new equipment from JSON file
echo.
echo 💾 Make sure you have a backup if needed!
echo.
pause
echo.
echo Starting fresh import (clearing existing data)...
node import-equipment.js --clear
echo.
echo Fresh import completed!
pause
