# CEE Lab Equipment Manager - Data Import Guide

## 📋 Overview

This guide explains how to import equipment data from Excel/Word files into the CEE Lab Equipment Manager system. The process uses Google Gemini AI to convert your data into the correct format, then imports it into the database.

## 🆕 Latest Features (June 2025)

### Enhanced Search Capabilities
- ✅ **FIU ID Search with/without dashes** - Search "4980-00123213" or "498000123213"
- ✅ **Model field search** - Find equipment by model number
- ✅ **Comprehensive text search** - Name, brand, model, serial, FIU ID, notes
- ✅ **Real-time search** - Instant results as you type

### Modern Status Categories
- ✅ **Professional status system** - Updated from basic "Healthy/Damaged" 
- ✅ **8 comprehensive statuses** - Active, Stored, Surplus, Obsolete, Broken, Troubleshooting, Maintenance, Disposed
- ✅ **"Not specified" option** - For equipment with unknown status

### Flexible Data Entry
- ✅ **Optional buying date** - No longer required field
- ✅ **Optional price** - Can add equipment without purchase price
- ✅ **Enhanced age calculation** - Shows "Not specified" for missing dates

### QR Code & Printing
- ✅ **Robust QR code generation** - Multiple fallback methods
- ✅ **Equipment manual QR codes** - Link to documentation
- ✅ **Word document generation** - Professional equipment reports

## 🗃️ Database Structure

### Required Fields
- **name** (TEXT) - Equipment name/title
- **category** (TEXT) - Brand/manufacturer
- **lab** (TEXT) - Lab room number (EC3625, EC3630, EC3760, EC3765, OU107, OU106)
- **serialNumber** (TEXT) - Unique serial number
- **quantity** (INTEGER) - Number of items
- **status** (TEXT) - Equipment condition (see valid statuses below)

### Optional Fields (New: Buying Date & Price are now optional!)
- **buyingDate** (TEXT) - Purchase date in YYYY-MM-DD format (optional)
- **price** (REAL) - Purchase price in dollars (optional)
- **model** (TEXT) - Model number/identifier
- **fiuId** (TEXT) - FIU identification number (searchable with/without dashes)
- **notes** (TEXT) - Additional comments or description
- **manualLink** (TEXT) - URL to equipment manual or documentation
- **image** (TEXT) - Image file path
- **created_at** (DATETIME) - Creation timestamp
- **updated_at** (DATETIME) - Last update timestamp

## 📥 Import Process

### Step 1: Use Google Gemini AI for Data Conversion

#### 🤖 Complete Gemini Prompt (Copy & Paste this):

```
You are a data conversion specialist for the CEE Lab Equipment Manager system. Convert the following equipment data to JSON format.

REQUIREMENTS:
1. Convert all data to valid JSON array format
2. Use the exact field names specified below
3. Follow all formatting rules precisely

REQUIRED FIELDS:
- name: Equipment name/title (required)
- category: Brand/manufacturer (required) 
- lab: Must be one of: "EC3625", "EC3630", "EC3760", "EC3765", "OU107", "OU106" (required)
- serialNumber: Unique identifier - if missing, generate as "EQUIP-001", "EQUIP-002", etc. (required)
- quantity: Number as integer (required, default to 1)
- status: Must be one of: "Active / In Use", "Stored / In Storage", "Surplus", "Obsolete / Outdated", "Broken / Non-Functional", "Troubleshooting", "Under Maintenance", "To be Disposed", "Not specified" (required, default to "Active / In Use")

OPTIONAL FIELDS (use empty string "" if not available):
- buyingDate: Format as "YYYY-MM-DD" or "" if unknown
- price: Number without $ symbol, or null if unknown
- model: Model number/identifier
- fiuId: FIU ID number (keep dashes if present)
- notes: Additional description
- manualLink: URL to manual/documentation

FORMATTING RULES:
1. Remove all $ symbols from prices
2. Convert dates to YYYY-MM-DD format
3. Map room/location descriptions to valid lab codes
4. Generate unique serial numbers if missing
5. Map status descriptions to valid status values
6. Use null for missing numeric values (price)
7. Use empty string "" for missing text values

EXAMPLE OUTPUT:
[
  {
    "name": "Digital Oscilloscope",
    "category": "Tektronix",
    "model": "TDS2024B",
    "lab": "EC3625",
    "buyingDate": "2023-01-15",
    "serialNumber": "TEK-001",
    "fiuId": "4980-00123456",
    "quantity": 1,
    "price": 2500.00,
    "status": "Active / In Use",
    "notes": "4-channel digital oscilloscope",
    "manualLink": "https://www.tektronix.com/manual"
  }
]

Now convert this equipment data:

[PASTE YOUR EQUIPMENT DATA HERE - Excel table, Word list, or any format]
```

#### 🎯 How to Use:
1. **Copy the entire prompt above** (from "You are a data conversion..." to "Now convert this equipment data:")
2. **Add your equipment data** at the end (Excel table, Word list, etc.)
3. **Paste into Google Gemini** (gemini.google.com)
4. **Get perfect JSON output** ready for import!

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

## 📄 JSON Format Example (Updated 2025)

```json
[
  {
    "name": "Digital Multimeter",
    "category": "Fluke",
    "model": "87V",
    "lab": "EC3625",
    "buyingDate": "2023-01-15",
    "serialNumber": "DMM-001",
    "fiuId": "4980-00012345",
    "quantity": 1,
    "price": 299.99,
    "status": "Active / In Use",
    "notes": "High precision multimeter for electrical measurements",
    "manualLink": "https://www.fluke.com/manual-87v"
  },
  {
    "name": "Oscilloscope",
    "category": "Tektronix",
    "model": "TDS2024B",
    "lab": "EC3630",
    "buyingDate": "",
    "serialNumber": "OSC-002",
    "fiuId": "4980-00023456",
    "quantity": 1,
    "price": null,
    "status": "Stored / In Storage",
    "notes": "4-channel digital oscilloscope, needs calibration",
    "manualLink": ""
  },
  {
    "name": "Laboratory Scale",
    "category": "Mettler Toledo",
    "model": "",
    "lab": "EC3760",
    "buyingDate": "",
    "serialNumber": "EQUIP-003",
    "fiuId": "",
    "quantity": 1,
    "price": null,
    "status": "Not specified",
    "notes": "Precision scale, status unknown",
    "manualLink": ""
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

### Valid Status Values (Updated 2025)
- **"Active / In Use"** - Currently being used (default)
- **"Stored / In Storage"** - Stored but functional
- **"Surplus"** - Available for transfer/disposal
- **"Obsolete / Outdated"** - Technology outdated
- **"Broken / Non-Functional"** - Not working, needs repair
- **"Troubleshooting"** - Under investigation/diagnosis
- **"Under Maintenance"** - Scheduled repair/service
- **"To be Disposed"** - Marked for disposal
- **"Not specified"** - Status unknown/undefined

## 🔧 Import Features

### Smart Handling
- ✅ **Duplicate Serial Detection** - Automatically renames duplicates (adds -DUP1, -DUP2, etc.)
- ✅ **Data Validation** - Checks required fields and valid values
- ✅ **Error Reporting** - Shows detailed error messages for failed imports
- ✅ **Success Tracking** - Counts and lists successfully imported items
- ✅ **Optional Field Support** - Buying date and price are now optional
- ✅ **Enhanced Status System** - 9 professional status categories

### Advanced Search Features
- ✅ **FIU ID Flexibility** - Search with or without dashes (4980-00123213 or 498000123213)
- ✅ **Multi-field Search** - Name, brand, model, serial, FIU ID, notes all searchable
- ✅ **Real-time Results** - Instant search with 300ms debounce
- ✅ **Server & Client Search** - Works both online and offline

### Safety Features
- ✅ **Backup Friendly** - Option to keep existing data
- ✅ **Rollback Safe** - Import errors don't corrupt database
- ✅ **Schema Validation** - Ensures database has correct columns
- ✅ **Age Calculation** - Handles missing dates gracefully

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

#### 5. Invalid Status Value
```
❌ Item 3: Invalid status "Working". Must be one of the valid status values
```
**Solution**: Use only the valid status values listed above (e.g., "Active / In Use")

#### 6. FIU ID Search Not Working
**Symptoms**: Cannot find equipment by FIU ID
**Solution**: 
- Try searching without dashes: "498000123213" instead of "4980-00123213"
- Check server is running: `node server.js`
- Clear browser cache and refresh

### Database Issues

#### Missing Model/FIU ID Columns
```bash
# Run database fix
node fix-database.js
```

#### Search Not Finding Equipment
```bash
# Restart server to apply search updates
# Stop server: Ctrl+C
node server.js
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
5. **QR codes** appear for equipment with manual links
6. **Search functionality** works for all fields including FIU IDs (with/without dashes)
7. **Status categories** display with proper icons and colors
8. **Age calculation** shows "Not specified" for equipment without buying dates

## 💡 Tips & Best Practices

### Data Preparation
1. **Use the Gemini prompt** - Copy the complete prompt for best results
2. **Verify lab codes** - Map locations to valid EC/OU codes
3. **Include FIU IDs** - Add dashes for better readability (4980-00123213)
4. **Add manual links** - Include URLs to equipment documentation
5. **Use descriptive notes** - Add useful details about equipment condition

### Import Strategy
1. **Backup First** - Copy `equipment.db` before major imports
2. **Test Small** - Try importing a few items first to verify format
3. **Use Fresh Import** - For first-time setup, always use `--clear` option
4. **Check Console** - Watch for validation errors and warnings
5. **Verify Results** - Check web application after import to confirm data

### Search Optimization
1. **FIU ID Format** - Either "4980-00123213" or "498000123213" works
2. **Partial Search** - Type first few characters for quick results
3. **Use Filters** - Combine search with lab and status filters
4. **Case Insensitive** - Search works regardless of capitalization

### Maintenance
1. **Regular Backups** - Save `equipment.db` regularly
2. **Update Status** - Keep equipment status current
3. **Add Images** - Upload photos through the web interface
4. **Review Data** - Periodically check for duplicates or errors

---

## 🆕 What's New in 2025

### Enhanced Search
- **FIU ID without dashes** - Search "498000123213" finds "4980-00123213"
- **Model field search** - Find equipment by model number
- **Better placeholder text** - Search box shows all searchable fields

### Flexible Data Entry
- **Optional buying date** - No longer required for equipment entry
- **Optional price** - Add equipment without purchase information
- **Enhanced age calculation** - Graceful handling of missing dates

### Professional Status System
- **9 status categories** - From basic 4 to comprehensive 9 statuses
- **Industry standard** - Active, Stored, Surplus, Obsolete, etc.
- **"Not specified" option** - For equipment with unknown status

### Improved QR Codes
- **Multiple fallbacks** - Ensures QR codes always generate
- **Manual link QR codes** - Direct links to equipment documentation
- **Better print interface** - Enhanced QR code printing functionality

**For support, check the console output for detailed error messages and refer to this guide for solutions.**
