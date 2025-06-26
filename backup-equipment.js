const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { promisify } = require('util');

// Promisify fs functions for better async handling
const copyFile = promisify(fs.copyFile);
const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

// Database file path
const DB_PATH = './equipment.db';

// Create backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFileName = `equipment_backup_${timestamp}.json`;

/**
 * Copy image files for equipment that have images
 */
async function copyEquipmentImages(equipmentData, backupDir) {
    const uploadsDir = './uploads';
    const backupUploadsDir = path.join(backupDir, 'uploads');
    
    // Check if uploads directory exists
    try {
        await access(uploadsDir);
    } catch (err) {
        console.log('📁 No uploads directory found, skipping image backup');
        return { copiedImages: 0, errors: [] };
    }
    
    // Create backup uploads directory
    try {
        await mkdir(backupUploadsDir, { recursive: true });
    } catch (err) {
        console.error('❌ Error creating backup uploads directory:', err.message);
        return { copiedImages: 0, errors: [err.message] };
    }
    
    let copiedImages = 0;
    const errors = [];
    
    // Get list of image files that need to be backed up
    const imageFiles = equipmentData
        .filter(eq => eq.image)
        .map(eq => {
            // Remove /uploads/ prefix if it exists in the database
            const imageName = eq.image.startsWith('/uploads/') ? eq.image.substring(9) : eq.image;
            return imageName;
        })
        .filter((image, index, self) => self.indexOf(image) === index); // Remove duplicates
    
    console.log(`🖼️  Found ${imageFiles.length} unique image files to backup`);
    
    for (const imageFile of imageFiles) {
        const sourcePath = path.join(uploadsDir, imageFile);
        const destPath = path.join(backupUploadsDir, imageFile);
        
        try {
            await access(sourcePath);
            await copyFile(sourcePath, destPath);
            copiedImages++;
            console.log(`✅ Copied image: ${imageFile}`);
        } catch (err) {
            errors.push(`Failed to copy ${imageFile}: ${err.message}`);
            console.warn(`⚠️  Could not copy image ${imageFile}: ${err.message}`);
        }
    }
    
    return { copiedImages, errors };
}

/**
 * Create a ZIP archive with equipment data and images
 */
function createBackupArchive(backupDir, archiveName) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(archiveName);
        const archive = archiver('zip', {
            zlib: { level: 9 } // Maximum compression
        });
        
        output.on('close', () => {
            console.log(`📦 Archive created: ${archiveName}`);
            console.log(`📊 Archive size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
            resolve();
        });
        
        archive.on('error', (err) => {
            reject(err);
        });
        
        archive.pipe(output);
        
        // Add all files from backup directory
        archive.directory(backupDir, false);
        
        archive.finalize();
    });
}
/**
 * Backup all equipment data from the database to a JSON file with images
 * The JSON format matches the import format for easy restoration
 */
async function backupEquipmentData() {
    console.log('🔄 Starting equipment backup...');
    
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('❌ Error opening database:', err.message);
            return;
        }
        console.log('✅ Connected to SQLite database for backup');
    });

    // Query to get all equipment data
    const query = `
        SELECT 
            name,
            category,
            model,
            lab,
            buyingDate,
            serialNumber,
            fiuId,
            quantity,
            price,
            status,
            notes,
            image,
            manualLink,
            created_at,
            updated_at
        FROM equipment 
        ORDER BY lab, name
    `;

    db.all(query, [], async (err, rows) => {
        if (err) {
            console.error('❌ Error querying database:', err.message);
            db.close();
            return;
        }

        console.log(`📊 Found ${rows.length} equipment records to backup`);

        // Transform the data to match import format
        const backupData = rows.map(row => {
            const equipment = {
                name: row.name,
                category: row.category, // This is the brand field
                lab: row.lab,
                serialNumber: row.serialNumber,
                quantity: row.quantity,
                status: row.status || 'Not specified'
            };

            // Add optional fields only if they have values
            if (row.model) equipment.model = row.model;
            if (row.fiuId) equipment.fiuId = row.fiuId;
            if (row.buyingDate) equipment.buyingDate = row.buyingDate;
            if (row.price !== null && row.price !== undefined) equipment.price = row.price;
            if (row.notes) equipment.notes = row.notes;
            if (row.image) equipment.image = row.image;
            if (row.manualLink) equipment.manualLink = row.manualLink;

            // Add metadata for reference
            if (row.created_at) equipment.created_at = row.created_at;
            if (row.updated_at) equipment.updated_at = row.updated_at;

            return equipment;
        });

        // Create backup metadata
        const backupMetadata = {
            backupDate: new Date().toISOString(),
            totalRecords: rows.length,
            labs: [...new Set(rows.map(r => r.lab))].sort(),
            statusCounts: {},
            imageCount: rows.filter(r => r.image).length,
            description: 'Complete equipment database backup with images - can be used with import-equipment.js to restore data'
        };

        // Count equipment by status
        rows.forEach(row => {
            const status = row.status || 'Not specified';
            backupMetadata.statusCounts[status] = (backupMetadata.statusCounts[status] || 0) + 1;
        });

        // Create backup directory
        const backupDir = `backup_${timestamp}`;
        try {
            await mkdir(backupDir, { recursive: true });
        } catch (err) {
            console.error('❌ Error creating backup directory:', err.message);
            db.close();
            return;
        }

        // Create the backup data objects
        const backupObject = {
            metadata: backupMetadata,
            equipment: backupData
        };

        // Write JSON files to backup directory
        const backupJsonPath = path.join(backupDir, backupFileName);
        const restoreJsonPath = path.join(backupDir, `equipment_restore_${timestamp}.json`);
        
        try {
            fs.writeFileSync(backupJsonPath, JSON.stringify(backupObject, null, 2), 'utf8');
            fs.writeFileSync(restoreJsonPath, JSON.stringify(backupData, null, 2), 'utf8');
            
            console.log('\n✅ JSON files created successfully!');
            console.log(`📁 Backup JSON: ${backupJsonPath}`);
            console.log(`📁 Restore JSON: ${restoreJsonPath}`);
            
        } catch (writeErr) {
            console.error('❌ Error writing JSON files:', writeErr.message);
            db.close();
            return;
        }

        // Copy image files
        console.log('\n🖼️  Starting image backup...');
        try {
            const imageResult = await copyEquipmentImages(backupData, backupDir);
            
            if (imageResult.copiedImages > 0) {
                console.log(`✅ Successfully copied ${imageResult.copiedImages} image files`);
            }
            
            if (imageResult.errors.length > 0) {
                console.log(`⚠️  ${imageResult.errors.length} image copy errors:`);
                imageResult.errors.forEach(error => console.log(`   ${error}`));
            }
            
            // Update metadata with image info
            backupMetadata.imagesCopied = imageResult.copiedImages;
            backupMetadata.imageErrors = imageResult.errors.length;
            
            // Re-write the backup JSON with updated metadata
            fs.writeFileSync(backupJsonPath, JSON.stringify(backupObject, null, 2), 'utf8');
            
        } catch (imageErr) {
            console.error('❌ Error during image backup:', imageErr.message);
        }

        // Create ZIP archive
        const archiveName = `equipment_backup_${timestamp}.zip`;
        console.log('\n📦 Creating backup archive...');
        
        try {
            await createBackupArchive(backupDir, archiveName);
            
            console.log('\n🎉 Complete backup finished successfully!');
            console.log(`📦 Archive created: ${archiveName}`);
            console.log(`📊 Total records backed up: ${rows.length}`);
            console.log(`🖼️  Images backed up: ${backupMetadata.imagesCopied || 0}`);
            console.log(`🏷️  Labs included: ${backupMetadata.labs.join(', ')}`);
            console.log('\n📋 Status Summary:');
            Object.entries(backupMetadata.statusCounts).forEach(([status, count]) => {
                console.log(`   ${status}: ${count} items`);
            });
            
            console.log('\n💡 To restore this backup:');
            console.log(`   1. Extract: ${archiveName}`);
            console.log(`   2. Copy images from extracted 'uploads' folder to './uploads'`);
            console.log(`   3. Run: node import-equipment.js equipment_restore_${timestamp}.json`);
            console.log(`   Or use: node restore-equipment.js ${archiveName}`);
            
            // Clean up backup directory (optional - keep for debugging)
            // fs.rmSync(backupDir, { recursive: true });
            
        } catch (archiveErr) {
            console.error('❌ Error creating archive:', archiveErr.message);
            console.log(`📁 Backup files available in: ${backupDir}`);
        }

        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('✅ Database connection closed');
            }
        });
    });
}

/**
 * Create a simple restore-ready JSON file (equipment array only)
 * This format can be directly used with import-equipment.js
 */
function createRestoreFile() {
    console.log('\n🔄 Creating restore-ready JSON file...');
    
    const db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
            console.error('❌ Error opening database:', err.message);
            return;
        }
    });

    const query = `
        SELECT 
            name,
            category,
            model,
            lab,
            buyingDate,
            serialNumber,
            fiuId,
            quantity,
            price,
            status,
            notes,
            image,
            manualLink
        FROM equipment 
        ORDER BY lab, name
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('❌ Error querying database:', err.message);
            db.close();
            return;
        }

        // Transform data for direct import
        const equipmentArray = rows.map(row => {
            const equipment = {
                name: row.name,
                category: row.category,
                lab: row.lab,
                serialNumber: row.serialNumber,
                quantity: row.quantity,
                status: row.status || 'Not specified'
            };

            // Add optional fields only if they have values
            if (row.model) equipment.model = row.model;
            if (row.fiuId) equipment.fiuId = row.fiuId;
            if (row.buyingDate) equipment.buyingDate = row.buyingDate;
            if (row.price !== null && row.price !== undefined) equipment.price = row.price;
            if (row.notes) equipment.notes = row.notes;
            if (row.image) equipment.image = row.image;
            if (row.manualLink) equipment.manualLink = row.manualLink;

            return equipment;
        });

        const restoreFileName = `equipment_restore_${timestamp}.json`;
        
        try {
            fs.writeFileSync(restoreFileName, JSON.stringify(equipmentArray, null, 2), 'utf8');
            
            console.log(`✅ Restore file created: ${restoreFileName}`);
            console.log(`📊 Ready to import ${equipmentArray.length} equipment records`);
            console.log(`💡 To restore: node import-equipment.js ${restoreFileName}`);
            
        } catch (writeErr) {
            console.error('❌ Error writing restore file:', writeErr.message);
        }

        db.close();
    });
}

// Check if script is run directly
if (require.main === module) {
    console.log('🔧 CEE Lab Equipment Backup Tool');
    console.log('================================\n');
    
    // Check if database exists
    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Database file not found:', DB_PATH);
        console.log('Please make sure the server has been run at least once to create the database.');
        process.exit(1);
    }
    
    // Run the backup (now async)
    backupEquipmentData().catch(err => {
        console.error('❌ Backup failed:', err.message);
        process.exit(1);
    });
}

module.exports = {
    backupEquipmentData,
    createRestoreFile
};
