const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Direct Database Column Addition');
console.log('==================================');

const db = new sqlite3.Database('./equipment.db');

// First, let's see the current schema
db.all("PRAGMA table_info(equipment)", (err, rows) => {
    if (err) {
        console.error('Error checking schema:', err);
        return;
    }
    
    console.log('\nCurrent columns:');
    rows.forEach(row => console.log(`  - ${row.name} (${row.type})`));
    
    const hasModel = rows.find(r => r.name === 'model');
    const hasFiuId = rows.find(r => r.name === 'fiuId');
    
    console.log(`\nModel column exists: ${hasModel ? 'YES' : 'NO'}`);
    console.log(`FiuId column exists: ${hasFiuId ? 'YES' : 'NO'}`);
    
    // Add columns if they don't exist
    if (!hasModel) {
        console.log('\nAdding model column...');
        db.run("ALTER TABLE equipment ADD COLUMN model TEXT", (err) => {
            if (err) {
                console.error('Error adding model:', err.message);
            } else {
                console.log('✅ Model column added');
            }
            
            // Now add fiuId
            if (!hasFiuId) {
                console.log('Adding fiuId column...');
                db.run("ALTER TABLE equipment ADD COLUMN fiuId TEXT", (err) => {
                    if (err) {
                        console.error('Error adding fiuId:', err.message);
                    } else {
                        console.log('✅ FiuId column added');
                    }
                    
                    // Verify final schema
                    verifySchema();
                });
            } else {
                verifySchema();
            }
        });
    } else if (!hasFiuId) {
        console.log('Adding fiuId column...');
        db.run("ALTER TABLE equipment ADD COLUMN fiuId TEXT", (err) => {
            if (err) {
                console.error('Error adding fiuId:', err.message);
            } else {
                console.log('✅ FiuId column added');
            }
            verifySchema();
        });
    } else {
        console.log('\n✅ All columns already exist!');
        verifySchema();
    }
});

function verifySchema() {
    console.log('\n🔍 Final verification...');
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('Error verifying schema:', err);
        } else {
            console.log('\nFinal schema:');
            rows.forEach(row => {
                const isNew = (row.name === 'model' || row.name === 'fiuId') ? ' 🆕' : '';
                console.log(`  - ${row.name} (${row.type})${isNew}`);
            });
        }
        
        // Test update query
        testUpdate();
    });
}

function testUpdate() {
    console.log('\n🧪 Testing update query...');
    
    const updateSQL = `
        UPDATE equipment 
        SET name = ?, category = ?, model = ?, lab = ?, buyingDate = ?, serialNumber = ?, fiuId = ?,
            quantity = ?, price = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    // Get first equipment to test with
    db.get("SELECT * FROM equipment LIMIT 1", (err, row) => {
        if (err || !row) {
            console.log('No test data available');
            db.close();
            return;
        }
        
        console.log(`Testing with equipment ID: ${row.id}`);
        
        // Test the update with new fields
        db.run(updateSQL, [
            row.name,
            row.category,
            'TEST-MODEL-123', // Test model
            row.lab,
            row.buyingDate,
            row.serialNumber,
            'FIU-TEST-456', // Test FIU ID
            row.quantity,
            row.price,
            row.status,
            row.notes || '',
            row.id
        ], function(err) {
            if (err) {
                console.error('❌ Update test failed:', err.message);
            } else {
                console.log('✅ Update test successful!');
                
                // Verify the update worked
                db.get("SELECT model, fiuId FROM equipment WHERE id = ?", [row.id], (err, updated) => {
                    if (err) {
                        console.error('Error checking update:', err);
                    } else {
                        console.log(`Model saved: ${updated.model}`);
                        console.log(`FIU ID saved: ${updated.fiuId}`);
                    }
                    
                    // Restore original values
                    db.run(updateSQL, [
                        row.name, row.category, null, row.lab, row.buyingDate, 
                        row.serialNumber, null, row.quantity, row.price, 
                        row.status, row.notes || '', row.id
                    ], () => {
                        console.log('Test data restored');
                        db.close();
                        console.log('\n🎉 Database is ready for Model and FIU ID!');
                    });
                });
            }
        });
    });
}
