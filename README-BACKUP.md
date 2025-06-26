# Equipment Backup & Restore System

## Overview

The CEE Lab Equipment Manager now includes a comprehensive backup and restore system that allows you to:
- Create full backups of all equipment data **including images**
- Restore equipment data and images from backup files
- Maintain data integrity during system maintenance
- Migrate data between environments
- Create ZIP archives with complete data and image backups

## Files

### Backup Scripts
- `backup-equipment.js` - Creates backup files with images from the database
- `restore-equipment.js` - Restores data and images from backup files

### Generated Files
- `equipment_backup_[timestamp].zip` - **Complete backup archive with images**
- `equipment_backup_[timestamp].json` - Full backup with metadata (JSON only)
- `equipment_restore_[timestamp].json` - Import-ready format (JSON only)

## Usage

### Creating a Backup

To backup all equipment data including images from your database:

```bash
node backup-equipment.js
```

This command will:
1. Connect to your SQLite database (`equipment.db`)
2. Export all equipment records
3. **Copy all equipment images from ./uploads/**
4. Create a backup directory with:
   - **Full backup JSON** with metadata and statistics
   - **Restore-ready JSON** for direct import
   - **Images folder** with all equipment photos
5. **Create a ZIP archive** containing everything

### Example Output
```
🔧 CEE Lab Equipment Backup Tool
================================

🔄 Starting equipment backup...
✅ Connected to SQLite database for backup
📊 Found 214 equipment records to backup

✅ JSON files created successfully!
🖼️  Starting image backup...
🖼️  Found 11 unique image files to backup
✅ Copied image: equipment-1750791930260-4279847.jpg
✅ Copied image: equipment-1750792765063-192124963.jpeg
... (more images)
✅ Successfully copied 11 image files

� Creating backup archive...
📦 Archive created: equipment_backup_2025-06-25T15-53-22-890Z.zip
📊 Archive size: 0.77 MB

🎉 Complete backup finished successfully!
📦 Archive created: equipment_backup_2025-06-25T15-53-22-890Z.zip
📊 Total records backed up: 214
🖼️  Images backed up: 11
🏷️  Labs included: EC3625, EC3760, EC3765, OU107
```

### Restoring from Backup

#### Method 1: Complete Restore from ZIP (Recommended)
```bash
node restore-equipment.js equipment_backup_2025-06-25T15-53-22-890Z.zip
```

This will:
- Extract the ZIP archive
- Restore all equipment images to `./uploads/`
- Import all equipment data to the database
- Clean up temporary files

#### Method 2: JSON-only Restore
```bash
node restore-equipment.js equipment_backup_2025-06-25T15-53-22-890Z.json
node import-equipment.js equipment_restore_2025-06-25T15-53-22-890Z.json
```

### Complete Database Reset and Restore

To completely reset your database and restore from backup:

```bash
# 1. Stop the server (Ctrl+C if running)

# 2. Delete the current database
del equipment.db

# 3. Delete current images (optional)
del uploads\*

# 4. Start the server to recreate empty database
node server.js &

# 5. Stop the server (Ctrl+C)

# 6. Restore from complete backup
node restore-equipment.js equipment_backup_[timestamp].zip

# 7. Restart the server
node server.js
```

## File Formats

### Complete ZIP Backup (`equipment_backup_*.zip`)
```
equipment_backup_2025-06-25T15-53-22-890Z.zip
├── equipment_backup_2025-06-25T15-53-22-890Z.json    (Full backup with metadata)
├── equipment_restore_2025-06-25T15-53-22-890Z.json   (Import-ready format)
└── uploads/                                          (All equipment images)
    ├── equipment-1750791930260-4279847.jpg
    ├── equipment-1750792765063-192124963.jpeg
    └── ... (more images)
```

### Full Backup Format (`equipment_backup_*.json`)
```json
{
  "metadata": {
    "backupDate": "2025-06-25T15:53:22.890Z",
    "totalRecords": 214,
    "imageCount": 11,
    "imagesCopied": 11,
    "labs": ["EC3625", "EC3760", "EC3765", "OU107"],
    "statusCounts": {
      "Active / In Use": 98,
      "Not specified": 116
    },
    "description": "Complete equipment database backup with images"
  },
  "equipment": [
    {
      "name": "Ion Chromatographer",
      "category": "Dionex",
      "lab": "EC3625",
      "serialNumber": "96120038",
      "quantity": 1,
      "status": "Active / In Use",
      "model": "DX-120",
      "image": "/uploads/equipment-1750791930260-4279847.jpg"
    }
    // ... more equipment records
  ]
}
```

### Restore Format (`equipment_restore_*.json`)
```json
[
  {
    "name": "Ion Chromatographer",
    "category": "Dionex",
    "lab": "EC3625",
    "serialNumber": "96120038",
    "quantity": 1,
    "status": "Active / In Use",
    "model": "DX-120"
  }
  // ... more equipment records
]
```

## Data Fields Included

All equipment data is preserved in backups:

### Required Fields
- `name` - Equipment name
- `category` - Brand/manufacturer
- `lab` - Lab number
- `serialNumber` - Serial number
- `quantity` - Quantity
- `status` - Equipment status

### Optional Fields (included if present)
- `model` - Equipment model
- `fiuId` - FIU identification number
- `buyingDate` - Purchase date
- `price` - Equipment price
- `notes` - Additional notes
- `image` - **Image filename (images are backed up in ZIP archives)**
- `manualLink` - Manual/documentation link

### Metadata Fields (full backup only)
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp
- `imageCount` - **Number of equipment with images**
- `imagesCopied` - **Number of images successfully backed up**

## Image Backup Features

### What's Included
- ✅ **All equipment images** are automatically backed up
- ✅ **Multiple image formats** supported (JPG, PNG, JPEG, WEBP)
- ✅ **Unique images only** (duplicates are filtered out)
- ✅ **Complete ZIP archives** with data and images
- ✅ **Automatic image restoration** from ZIP backups

### Image Backup Process
1. **Detection**: Scans database for equipment with images
2. **Collection**: Identifies unique image files in `./uploads/`
3. **Backup**: Copies images to backup directory
4. **Archive**: Creates ZIP file with data and images
5. **Verification**: Reports successful/failed image copies

### Image Restore Process
1. **Extraction**: Unzips backup archive
2. **Image Restoration**: Copies images to `./uploads/` directory
3. **Data Import**: Imports equipment data with image references
4. **Cleanup**: Removes temporary files

## Backup Types

### 1. Complete ZIP Backup (Recommended)
- **File**: `equipment_backup_[timestamp].zip`
- **Contains**: Equipment data + Images + Metadata
- **Size**: Variable (depends on images)
- **Restore**: Full restoration with images

### 2. JSON-Only Backup
- **File**: `equipment_backup_[timestamp].json`
- **Contains**: Equipment data + Metadata (no images)
- **Size**: Small (KB range)
- **Restore**: Data only (images not restored)

### 3. Import-Ready Format
- **File**: `equipment_restore_[timestamp].json`
- **Contains**: Equipment data array only
- **Size**: Small (KB range)
- **Restore**: Direct import compatible

## Best Practices

### Regular Backups
Create regular backups before:
- Major system updates
- Data imports/modifications
- Server maintenance
- Database migrations
- **Before equipment image changes**

### Backup Storage
- Store backup files in a safe location
- Consider version control for important backups
- Keep multiple backup versions
- Document backup purposes and dates
- **Use ZIP backups for complete data+image preservation**

### Testing Restores
- Test restore procedures in development
- Verify data integrity after restore
- **Check that all images are restored correctly**
- Check that all features work correctly

## Automation

You can automate backups using:

### Windows Task Scheduler
Create a scheduled task to run `node backup-equipment.js` daily/weekly

### Cron Job (Linux/Mac)
```bash
# Daily backup at 2 AM
0 2 * * * cd /path/to/CEE_Lab_APP && node backup-equipment.js
```

### Batch Script (Windows)
```batch
@echo off
cd "C:\path\to\CEE_Lab_APP"
node backup-equipment.js
echo Backup completed at %date% %time%
```

### PowerShell Script (Windows)
```powershell
cd "C:\path\to\CEE_Lab_APP"
node backup-equipment.js
Write-Host "Backup completed at $(Get-Date)"
```

## Troubleshooting

### Common Issues

**Database not found**
- Ensure the server has been run at least once
- Check that `equipment.db` exists in the project directory

**Permission errors**
- Ensure write permissions in the project directory
- Run with appropriate user privileges

**Image backup failures**
- Check that `./uploads/` directory exists
- Verify image files are accessible
- Ensure sufficient disk space

**ZIP extraction errors**
- Check ZIP file integrity
- Ensure unzipper dependency is installed
- Verify file permissions

### Error Messages

**"Database file not found"**
- Solution: Run the server first to create the database

**"Invalid backup file format"**
- Solution: Check that the JSON file is properly formatted

**"Import validation failed"**
- Solution: Review equipment data for missing required fields

**"Could not copy image [filename]"**
- Solution: Check if image file exists in uploads directory
- Check file permissions and disk space

**"No equipment_restore_*.json file found in archive"**
- Solution: Ensure ZIP backup is complete and not corrupted

## Integration

The backup system integrates seamlessly with:
- Existing import/export functionality
- Database validation rules
- Equipment status categories
- **Complete image file management**
- **ZIP archive handling**
- **Automated cleanup processes**

## Security Notes

- Backup files contain all equipment data **and images**
- Store backups securely
- Consider encryption for sensitive data
- Limit access to backup files
- Regular backup file cleanup
- **ZIP archives may contain sensitive equipment photos**

## Summary

### ✅ What the Enhanced Backup System Does:

1. **Complete Data Backup**
   - All equipment records with full field data
   - Professional status categories preserved
   - Optional fields (buying date, price) included

2. **✨ Image Backup (New!)**
   - Automatically backs up all equipment images
   - Supports multiple image formats (JPG, PNG, JPEG, WEBP)
   - Creates organized backup structure
   - Filters duplicate images

3. **ZIP Archive Creation**
   - Single file contains everything
   - Compressed for space efficiency
   - Easy to transport and store

4. **Smart Restore Process**
   - Detects ZIP vs JSON backup format
   - Automatically restores images to correct location
   - Imports data with preserved image references
   - Cleans up temporary files

5. **Error Handling**
   - Reports missing images
   - Continues backup even if some images fail
   - Detailed error reporting and statistics

### 📊 Backup Statistics Example:
```
📊 Total records backed up: 214
🖼️  Images backed up: 11
🏷️  Labs included: EC3625, EC3760, EC3765, OU107
📦 Archive size: 0.77 MB
```

---

*For support or questions about the backup system, refer to the main README.md or check the application logs.*
