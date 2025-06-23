const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Import the existing data
const equipmentData = require('./data.js');

console.log('🔄 Starting data migration from data.js to equipment.db...');
console.log(`📊 Found ${equipmentData.length} equipment items to migrate`);

// Connect to database
const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to SQLite database.');
        migrateData();
    }
});

function migrateData() {
    // First, clear existing data to avoid duplicates
    db.run('DELETE FROM equipment', (err) => {
        if (err) {
            console.error('❌ Error clearing existing data:', err.message);
            return;
        }
        console.log('🧹 Cleared existing equipment data');
        
        // Insert data from data.js
        insertData();
    });
}

function insertData() {
    const insertSQL = `
        INSERT INTO equipment (name, category, model, lab, buyingDate, serialNumber, fiuId, quantity, price, status, notes, image)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const stmt = db.prepare(insertSQL);
    let successCount = 0;
    let errorCount = 0;
    const usedSerialNumbers = new Set();

    console.log('📥 Inserting equipment data...');
    console.log('🔍 Checking for duplicate serial numbers...');

    // First pass - identify duplicates
    const duplicateSerials = {};
    equipmentData.forEach(item => {
        if (duplicateSerials[item.serialNumber]) {
            duplicateSerials[item.serialNumber]++;
        } else {
            duplicateSerials[item.serialNumber] = 1;
        }
    });

    // Show duplicate information
    Object.keys(duplicateSerials).forEach(serial => {
        if (duplicateSerials[serial] > 1) {
            console.log(`⚠️  Found ${duplicateSerials[serial]} items with serial number: ${serial}`);
        }
    });

    equipmentData.forEach((item, index) => {
        let serialNumber = item.serialNumber;
        
        // Handle duplicate serial numbers by appending a suffix
        if (usedSerialNumbers.has(serialNumber)) {
            let counter = 1;
            let newSerial = `${serialNumber}-${counter}`;
            
            while (usedSerialNumbers.has(newSerial)) {
                counter++;
                newSerial = `${serialNumber}-${counter}`;
            }
            
            console.log(`🔄 Duplicate serial detected: "${serialNumber}" → "${newSerial}"`);
            serialNumber = newSerial;
        }
        
        usedSerialNumbers.add(serialNumber);        stmt.run([
            item.name,
            item.category,
            item.model || null,
            item.lab,
            item.buyingDate,
            serialNumber,  // Use the potentially modified serial number
            item.fiuId || null,
            item.quantity,
            item.price,
            item.status,
            item.notes || '',
            item.image || null
        ], function(err) {
            if (err) {
                console.error(`❌ Error inserting item ${index + 1} (${item.name}):`, err.message);
                errorCount++;
            } else {
                successCount++;
                const statusIcon = serialNumber !== item.serialNumber ? '🔄' : '✅';
                console.log(`${statusIcon} Inserted: ${item.name} (${item.lab}) - Serial: ${serialNumber}`);
            }

            // Check if this is the last item
            if (successCount + errorCount === equipmentData.length) {
                finalizeMigration(successCount, errorCount);
            }
        });
    });

    stmt.finalize();
}

function finalizeMigration(successCount, errorCount) {
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Successfully migrated: ${successCount} items`);
    console.log(`❌ Failed migrations: ${errorCount} items`);
    console.log(`📁 Total items in data.js: ${equipmentData.length}`);

    if (successCount > 0) {
        console.log('\n🎉 Migration completed successfully!');
        console.log('📄 Your data has been migrated to equipment.db');
        console.log('🔄 Duplicate serial numbers were automatically resolved with suffixes (-1, -2, etc.)');
        console.log('🔄 You can now start your server with: npm start');
        
        // Verify the migration
        verifyMigration();
    } else {
        console.log('\n❌ Migration failed - no data was inserted');
        
        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            }
        });
    }
}

function verifyMigration() {
    console.log('\n🔍 Verifying migration...');
    
    db.all('SELECT COUNT(*) as count, lab FROM equipment GROUP BY lab', (err, rows) => {
        if (err) {
            console.error('❌ Error verifying migration:', err.message);
        } else {
            console.log('\n📊 Equipment count by lab:');
            rows.forEach(row => {
                console.log(`   ${row.lab}: ${row.count} items`);
            });
            
            // Get total count
            db.get('SELECT COUNT(*) as total FROM equipment', (err, row) => {
                if (err) {
                    console.error('❌ Error getting total count:', err.message);
                } else {
                    console.log(`\n📈 Total equipment in database: ${row.total}`);
                    console.log('\n✨ Migration verification complete!');
                }
                
                // Close database connection
                db.close((err) => {
                    if (err) {
                        console.error('❌ Error closing database:', err.message);
                    } else {
                        console.log('🔐 Database connection closed.');
                        console.log('\n🚀 Ready to start your application!');
                    }
                });
            });
        }
    });
}
