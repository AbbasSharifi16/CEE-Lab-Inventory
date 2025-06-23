const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

console.log('📥 Equipment Data Import Tool');
console.log('=============================');

// Check command line arguments for clear option
const shouldClearFirst = process.argv.includes('--clear') || process.argv.includes('-c');

// Check if JSON file exists
const jsonFile = 'equipment_import.json';
if (!fs.existsSync(jsonFile)) {
    console.log(`❌ Error: ${jsonFile} not found!`);
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Use the GEMINI_CONVERSION_PROMPT.txt with Google Gemini');
    console.log('2. Paste your Excel/Word data to Gemini');
    console.log('3. Copy the JSON output from Gemini');
    console.log('4. Save it as "equipment_import.json" in this folder');
    console.log('5. Run this script again:');
    console.log('   node import-equipment.js           (keep existing data)');
    console.log('   node import-equipment.js --clear   (clear all first)');
    console.log('');
    console.log('📁 Expected file location:');
    console.log(`   ${__dirname}\\${jsonFile}`);
    process.exit(1);
}

// Load and parse JSON data
let equipmentData;
try {
    const rawData = fs.readFileSync(jsonFile, 'utf8');
    equipmentData = JSON.parse(rawData);
    console.log(`✅ Loaded ${equipmentData.length} equipment items from JSON`);
} catch (error) {
    console.error('❌ Error reading JSON file:', error.message);
    console.log('');
    console.log('💡 Make sure your JSON file is valid. You can check it at: https://jsonlint.com/');
    process.exit(1);
}

// Validate data structure
const requiredFields = ['name', 'category', 'lab', 'buyingDate', 'serialNumber', 'quantity', 'price', 'status'];
const validationErrors = [];

equipmentData.forEach((item, index) => {
    requiredFields.forEach(field => {
        if (item[field] === undefined || item[field] === null) {
            validationErrors.push(`Item ${index + 1}: Missing required field "${field}"`);
        }
    });
    
    // Check valid lab values
    const validLabs = ['EC3625', 'EC3630', 'EC3760', 'EC3765', 'OU107', 'OU106'];
    if (!validLabs.includes(item.lab)) {
        validationErrors.push(`Item ${index + 1}: Invalid lab "${item.lab}". Must be one of: ${validLabs.join(', ')}`);
    }
    
    // Check valid status values
    const validStatuses = ['Healthy', 'Damaged', 'Troubleshooting', 'Maintenance'];
    if (!validStatuses.includes(item.status)) {
        validationErrors.push(`Item ${index + 1}: Invalid status "${item.status}". Must be one of: ${validStatuses.join(', ')}`);
    }
});

if (validationErrors.length > 0) {
    console.log('❌ Validation errors found:');
    validationErrors.forEach(error => console.log(`   ${error}`));
    console.log('');
    console.log('💡 Please fix these errors in your JSON file and try again.');
    process.exit(1);
}

console.log('✅ Data validation passed');

// Connect to database
const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to database');
        
        if (shouldClearFirst) {
            console.log('🗑️  Clearing existing data first...');
            clearExistingData();
        } else {
            checkExistingData();
        }
    }
});

function clearExistingData() {
    db.get("SELECT COUNT(*) as count FROM equipment", (err, row) => {
        if (err) {
            console.error('Error checking existing data:', err);
            return;
        }
        
        const count = row.count;
        console.log(`📊 Found ${count} existing equipment items`);
        
        if (count === 0) {
            console.log('✅ Database already empty, proceeding with import...');
            importData();
            return;
        }
        
        console.log('🗑️  Deleting all existing equipment...');
        db.run("DELETE FROM equipment", function(err) {
            if (err) {
                console.error('❌ Error clearing data:', err.message);
                process.exit(1);
            } else {
                console.log(`✅ Cleared ${this.changes} existing items`);
                
                // Reset auto-increment
                db.run("DELETE FROM sqlite_sequence WHERE name='equipment'", (err) => {
                    if (!err) {
                        console.log('✅ Reset ID counter');
                    }
                    console.log('📥 Starting fresh import...');
                    importData();
                });
            }
        });
    });
}

function checkExistingData() {
    db.get("SELECT COUNT(*) as count FROM equipment", (err, row) => {
        if (err) {
            console.error('Error checking existing data:', err);
            return;
        }
        
        const count = row.count;
        if (count > 0) {
            console.log(`ℹ️  Database contains ${count} existing equipment items`);
            console.log('💡 New equipment will be added to existing data');
            console.log('💡 To clear all data first, run: node import-equipment.js --clear');
        } else {
            console.log('ℹ️  Database is empty - starting fresh import');
        }
        
        importData();
    });
}

function importData() {
    console.log('📥 Starting data import...');
    
    const insertSQL = `
        INSERT INTO equipment (name, category, model, lab, buyingDate, serialNumber, fiuId, quantity, price, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const stmt = db.prepare(insertSQL);
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    // Check for duplicate serial numbers
    const existingSerials = new Set();
    
    db.all("SELECT serialNumber FROM equipment", (err, rows) => {
        if (err) {
            console.error('Error checking existing serial numbers:', err);
            return;
        }
        
        rows.forEach(row => existingSerials.add(row.serialNumber));
        
        equipmentData.forEach((item, index) => {
            // Handle duplicate serial numbers
            let serialNumber = item.serialNumber;
            let counter = 1;
            while (existingSerials.has(serialNumber)) {
                serialNumber = `${item.serialNumber}-DUP${counter}`;
                counter++;
            }
            existingSerials.add(serialNumber);
            
            if (serialNumber !== item.serialNumber) {
                console.log(`⚠️  Duplicate serial "${item.serialNumber}" → "${serialNumber}"`);
            }
            
            stmt.run([
                item.name,
                item.category,
                item.model || null,
                item.lab,
                item.buyingDate,
                serialNumber,
                item.fiuId || null,
                item.quantity,
                parseFloat(item.price),
                item.status,
                item.notes || null
            ], function(err) {
                if (err) {
                    errorCount++;
                    errors.push(`Item ${index + 1} (${item.name}): ${err.message}`);
                } else {
                    successCount++;
                    console.log(`✅ Imported: ${item.name} (ID: ${this.lastID})`);
                }
                
                // Check if all items processed
                if (successCount + errorCount === equipmentData.length) {
                    finishImport();
                }
            });
        });
    });
    
    function finishImport() {
        stmt.finalize();
        
        console.log('');
        console.log('📊 Import Summary:');
        console.log(`✅ Successfully imported: ${successCount} items`);
        console.log(`❌ Failed imports: ${errorCount} items`);
        
        if (errors.length > 0) {
            console.log('');
            console.log('❌ Import errors:');
            errors.forEach(error => console.log(`   ${error}`));
        }
        
        if (successCount > 0) {
            console.log('');
            console.log('🎉 Import completed!');
            console.log('💡 Refresh your web application to see the new equipment');
            console.log('🌐 Open: http://localhost:3000');
        }
        
        db.close();
    }
}
