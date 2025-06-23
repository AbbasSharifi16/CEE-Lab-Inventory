# CEE Lab Equipment Manager - Data Import Guide

## 📋 Overview

This guide explains how to import equipment data from Excel/Word files into the CEE Lab Equipment Manager system. The process uses Google Gemini AI to convert your data into the correct format, then imports it into the database.

## 🗃️ Database Structure

### Required Fields
- **name** (TEXT) - Equipment name/title
- **category** (TEXT) - Brand/manufacturer
- **lab** (TEXT) - Lab room number (EC3625, EC3630, EC3760, EC3765, OU107, OU106)
- **buyingDate** (TEXT) - Purchase date in YYYY-MM-DD format
- **serialNumber** (TEXT) - Unique serial number
- **quantity** (INTEGER) - Number of items
- **price** (REAL) - Purchase price in dollars
- **status** (TEXT) - Equipment condition: "Healthy", "Damaged", "Troubleshooting", or "Maintenance"

### Optional Fields
- **model** (TEXT) - Model number/identifier
- **fiuId** (TEXT) - FIU identification number
- **notes** (TEXT) - Additional comments or description
- **image** (TEXT) - Image file path
- **created_at** (DATETIME) - Creation timestamp
- **updated_at** (DATETIME) - Last update timestamp

## 📥 Import Process

### Step 1: Convert Your Data with Google Gemini

1. **Open Google Gemini** (bard.google.com or gemini.google.com)
2. **Copy the prompt** from `GEMINI_CONVERSION_PROMPT.txt`
3. **Add your Excel/Word data** to the prompt
4. **Send to Gemini** - it will convert your data to JSON format

### Step 2: Save the JSON Output

1. **Copy Gemini's JSON response**
2. **Save as:** `equipment_import.json` in the project folder
3. **Verify the JSON** is valid (optional: check at jsonlint.com)

### Step 3: Import to Database

Choose one of the following methods:

#### Method 1: Fresh Import (Clears existing data)
```bash
# Command line
node import-equipment.js --clear

# Or double-click
import-equipment-fresh.bat
```

#### Method 2: Add to Existing Data
```bash
# Command line
node import-equipment.js

# Or double-click
import-equipment.bat
```

#### Method 3: Clear Data Only
```bash
# Command line
node clear-equipment.js

# Or double-click
clear-equipment.bat
```

## 🛠️ Available Tools

### Import Scripts
- **`import-equipment.js`** - Main import script with options
- **`clear-equipment.js`** - Clears all equipment data
- **`GEMINI_CONVERSION_PROMPT.txt`** - Template prompt for Google Gemini

### Batch Files (Windows)
- **`import-equipment-fresh.bat`** - Clear existing + Import new data
- **`import-equipment.bat`** - Import while keeping existing data
- **`clear-equipment.bat`** - Clear all equipment data only

### Test Scripts
- **`test-save.js`** - Tests database save functionality
- **`fix-database.js`** - Fixes database schema issues
- **`direct-db-fix.js`** - Direct database column additions

## 📄 JSON Format Example

```json
[
  {
    "name": "Digital Multimeter",
    "category": "Fluke",
    "model": "87V",
    "lab": "EC3625",
    "buyingDate": "2023-01-15",
    "serialNumber": "DMM-001",
    "fiuId": "FIU-12345",
    "quantity": 1,
    "price": 299.99,
    "status": "Healthy",
    "notes": "High precision multimeter for electrical measurements"
  },
  {
    "name": "Oscilloscope",
    "category": "Tektronix",
    "model": "",
    "lab": "EC3630",
    "buyingDate": "2022-08-20",
    "serialNumber": "OSC-002",
    "fiuId": "",
    "quantity": 1,
    "price": 1250.00,
    "status": "Healthy",
    "notes": ""
  }
]
```

## 🎯 Data Conversion Guidelines

### Gemini Conversion Rules
1. **Missing Data**: Use empty strings for optional fields, defaults for required fields
2. **Date Format**: Convert all dates to YYYY-MM-DD format
3. **Price Format**: Remove $ symbols and commas, convert to numbers
4. **Lab Mapping**: Map location descriptions to valid lab codes
5. **Serial Numbers**: Generate unique identifiers if missing (EQUIP-001, EQUIP-002, etc.)

### Valid Lab Codes
- **EC3625** - Civil Engineering Lab
- **EC3630** - Environmental Engineering Lab
- **EC3760** - Structural Engineering Lab
- **EC3765** - Geotechnical Engineering Lab
- **OU107** - Materials Testing Lab
- **OU106** - Research Lab

### Valid Status Values
- **"Healthy"** - Working equipment (default)
- **"Damaged"** - Broken/non-functional
- **"Troubleshooting"** - Under investigation
- **"Maintenance"** - Scheduled for repair

## 🔧 Import Features

### Smart Handling
- ✅ **Duplicate Serial Detection** - Automatically renames duplicates (adds -DUP1, -DUP2, etc.)
- ✅ **Data Validation** - Checks required fields and valid values
- ✅ **Error Reporting** - Shows detailed error messages for failed imports
- ✅ **Success Tracking** - Counts and lists successfully imported items

### Safety Features
- ✅ **Backup Friendly** - Option to keep existing data
- ✅ **Rollback Safe** - Import errors don't corrupt database
- ✅ **Schema Validation** - Ensures database has correct columns

## 📊 Import Results

After running the import, you'll see:

```
📊 Import Summary:
✅ Successfully imported: 15 items
❌ Failed imports: 0 items

🎉 Import completed!
💡 Refresh your web application to see the new equipment
🌐 Open: http://localhost:3000
```

## 🚨 Troubleshooting

### Common Issues

#### 1. JSON File Not Found
```
❌ Error: equipment_import.json not found!
```
**Solution**: Save your Gemini output as `equipment_import.json` in the project folder

#### 2. Invalid JSON Format
```
❌ Error reading JSON file: Unexpected token
```
**Solution**: Check JSON syntax at jsonlint.com and fix formatting errors

#### 3. Missing Required Fields
```
❌ Validation errors found:
   Item 1: Missing required field "name"
```
**Solution**: Ensure all required fields are present in your JSON data

#### 4. Invalid Lab Code
```
❌ Item 5: Invalid lab "Room 101". Must be one of: EC3625, EC3630, EC3760, EC3765, OU107, OU106
```
**Solution**: Map your location data to valid lab codes

### Database Issues

#### Missing Model/FIU ID Columns
```bash
# Run database fix
node fix-database.js
```

#### Database Corruption
```bash
# Clear and restart fresh
node clear-equipment.js
# Then import again
```

## 📝 Command Reference

### Import Commands
```bash
# Fresh import (recommended for first time)
node import-equipment.js --clear

# Add to existing data
node import-equipment.js

# Clear all data only
node clear-equipment.js

# Test database functionality
node test-save.js

# Fix database schema
node fix-database.js
```

### Server Commands
```bash
# Start server
node server.js

# Check server status
# Server runs at: http://localhost:3000
```

## 📁 File Structure

```
CEE_Lab_APP/
├── equipment_import.json          # Your JSON data file
├── GEMINI_CONVERSION_PROMPT.txt   # Prompt for AI conversion
├── import-equipment.js            # Main import script
├── clear-equipment.js             # Database clearing script
├── import-equipment-fresh.bat     # Windows: Clear + Import
├── import-equipment.bat           # Windows: Import only
├── clear-equipment.bat            # Windows: Clear only
├── server.js                      # Main application server
├── equipment.db                   # SQLite database file
└── README-IMPORT.md              # This file
```

## 🎉 Success Indicators

After successful import:
1. **Import script** shows "Import completed!"
2. **Web application** at http://localhost:3000 shows new equipment
3. **Equipment count** matches your imported data
4. **Model and FIU ID** fields are populated when provided
5. **Barcodes** appear for equipment with FIU IDs

## 💡 Tips

1. **Backup First**: Copy `equipment.db` before major imports
2. **Test Small**: Try importing a few items first to verify format
3. **Use Fresh Import**: For first-time setup, always use `--clear` option
4. **Check Console**: Watch for validation errors and warnings
5. **Verify Results**: Check web application after import to confirm data

---

**For support, check the console output for detailed error messages and refer to this guide for solutions.**
