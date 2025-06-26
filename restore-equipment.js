const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const { promisify } = require('util');

// Promisify fs functions
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);
const copyFile = promisify(fs.copyFile);

/**
 * Extract ZIP backup and restore images
 */
async function extractBackupArchive(archivePath) {
    const extractDir = `extracted_${Date.now()}`;
    
    console.log(`📦 Extracting archive: ${archivePath}`);
    
    try {
        await mkdir(extractDir, { recursive: true });
        
        // Extract the ZIP file
        await new Promise((resolve, reject) => {
            fs.createReadStream(archivePath)
                .pipe(unzipper.Extract({ path: extractDir }))
                .on('close', resolve)
                .on('error', reject);
        });
        
        console.log(`✅ Archive extracted to: ${extractDir}`);
        
        // Look for JSON files in extracted directory
        const files = fs.readdirSync(extractDir);
        const restoreFile = files.find(f => f.startsWith('equipment_restore_') && f.endsWith('.json'));
        
        if (!restoreFile) {
            throw new Error('No equipment_restore_*.json file found in archive');
        }
        
        const restoreFilePath = path.join(extractDir, restoreFile);
        
        // Check if there's an uploads directory with images
        const uploadsDir = path.join(extractDir, 'uploads');
        let imagesCopied = 0;
        
        try {
            await access(uploadsDir);
            
            // Ensure local uploads directory exists
            await mkdir('./uploads', { recursive: true });
            
            const imageFiles = fs.readdirSync(uploadsDir);
            console.log(`🖼️  Found ${imageFiles.length} image files to restore`);
            
            for (const imageFile of imageFiles) {
                try {
                    const sourcePath = path.join(uploadsDir, imageFile);
                    const destPath = path.join('./uploads', imageFile);
                    
                    await copyFile(sourcePath, destPath);
                    imagesCopied++;
                    console.log(`✅ Restored image: ${imageFile}`);
                } catch (err) {
                    console.warn(`⚠️  Could not restore image ${imageFile}: ${err.message}`);
                }
            }
            
            console.log(`🖼️  Successfully restored ${imagesCopied} images`);
            
        } catch (err) {
            console.log('📁 No images found in backup archive');
        }
        
        return { restoreFilePath, extractDir, imagesCopied };
        
    } catch (err) {
        throw new Error(`Failed to extract archive: ${err.message}`);
    }
}

/**
 * Quick Restore Script
 * Restores equipment data from backup files created by backup-equipment.js
 */

// Get command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
    console.log('🔧 CEE Lab Equipment Restore Tool');
    console.log('=================================\n');
    console.log('Usage: node restore-equipment.js <backup-file>');
    console.log('\nSupported formats:');
    console.log('  - ZIP archives: equipment_backup_*.zip (includes images)');
    console.log('  - JSON files: equipment_backup_*.json or equipment_restore_*.json');
    console.log('\nExamples:');
    console.log('  node restore-equipment.js equipment_backup_2025-01-15T10-30-00-000Z.zip');
    console.log('  node restore-equipment.js equipment_backup_2025-01-15T10-30-00-000Z.json');
    console.log('  node restore-equipment.js equipment_restore_2025-01-15T10-30-00-000Z.json');
    console.log('\nThe ZIP format includes both data and images for complete restoration.');
    process.exit(1);
}

const backupFile = args[0];

// Check if backup file exists
if (!fs.existsSync(backupFile)) {
    console.error(`❌ Backup file not found: ${backupFile}`);
    process.exit(1);
}

console.log('🔄 Starting equipment restore...');
console.log(`📁 Processing backup file: ${backupFile}`);

async function processRestore() {
    // Check if it's a ZIP file or JSON file
    const isZipFile = path.extname(backupFile).toLowerCase() === '.zip';
    let tempFileName;
    let extractDir;
    let imagesCopied = 0;

    try {
        let equipmentArray;
        
        if (isZipFile) {
            // Handle ZIP archive with images
            const extractResult = await extractBackupArchive(backupFile);
            tempFileName = extractResult.restoreFilePath;
            extractDir = extractResult.extractDir;
            imagesCopied = extractResult.imagesCopied;
            
            // Read the extracted JSON file
            const backupData = JSON.parse(fs.readFileSync(tempFileName, 'utf8'));
            equipmentArray = backupData;
            
            console.log('📦 ZIP archive processed successfully');
            
        } else {
            // Handle JSON file (original format)
            const backupData = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
            
            // Check if it's a full backup (with metadata) or simple restore format
            if (backupData.metadata && backupData.equipment) {
                console.log('📊 Found full backup with metadata');
                console.log(`📅 Backup date: ${backupData.metadata.backupDate}`);
                console.log(`📋 Total records: ${backupData.metadata.totalRecords}`);
                console.log(`🏷️  Labs: ${backupData.metadata.labs.join(', ')}`);
                if (backupData.metadata.imageCount) {
                    console.log(`🖼️  Images in backup: ${backupData.metadata.imageCount} (JSON only - images not restored)`);
                }
                equipmentArray = backupData.equipment;
            } else if (Array.isArray(backupData)) {
                console.log('📊 Found simple restore format');
                equipmentArray = backupData;
            } else {
                throw new Error('Invalid backup file format');
            }
            
            // Create temporary restore file for JSON backups
            tempFileName = `temp_restore_${Date.now()}.json`;
            fs.writeFileSync(tempFileName, JSON.stringify(equipmentArray, null, 2), 'utf8');
        }
        
        console.log(`✅ Extracted ${equipmentArray.length} equipment records`);
        if (imagesCopied > 0) {
            console.log(`🖼️  Restored ${imagesCopied} equipment images`);
        }
        
        // Use the existing import script
        const { spawn } = require('child_process');
        
        console.log('\n🚀 Starting import process...');
        const importProcess = spawn('node', ['import-equipment.js', tempFileName], {
            stdio: 'inherit'
        });
        
        importProcess.on('close', (code) => {
            // Clean up temporary files
            try {
                if (!isZipFile || tempFileName.includes('temp_restore_')) {
                    fs.unlinkSync(tempFileName);
                    console.log(`🧹 Cleaned up temporary file: ${path.basename(tempFileName)}`);
                }
                
                if (extractDir) {
                    fs.rmSync(extractDir, { recursive: true });
                    console.log(`🧹 Cleaned up extracted files: ${extractDir}`);
                }
            } catch (err) {
                console.warn(`⚠️  Could not clean up temporary files: ${err.message}`);
            }
            
            if (code === 0) {
                console.log('\n🎉 Equipment restore completed successfully!');
                if (imagesCopied > 0) {
                    console.log(`🖼️  ${imagesCopied} images have been restored to ./uploads/`);
                }
                console.log('✅ Your equipment database and images are now restored');
            } else {
                console.log(`\n❌ Restore process exited with code ${code}`);
            }
        });
        
        importProcess.on('error', (err) => {
            console.error('❌ Error running import script:', err.message);
            
            // Clean up temporary files
            try {
                if (tempFileName && (!isZipFile || tempFileName.includes('temp_restore_'))) {
                    fs.unlinkSync(tempFileName);
                }
                if (extractDir) {
                    fs.rmSync(extractDir, { recursive: true });
                }
            } catch (cleanupErr) {
                // Ignore cleanup errors
            }
        });
        
    } catch (err) {
        console.error('❌ Error processing backup file:', err.message);
        process.exit(1);
    }
}

// Run the restore process
processRestore().catch(err => {
    console.error('❌ Restore failed:', err.message);
    process.exit(1);
});
