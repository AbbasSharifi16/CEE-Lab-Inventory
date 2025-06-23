const sqlite3 = require('sqlite3').verbose();

console.log('🧪 Testing FIU ID Save Functionality');
console.log('====================================');

const db = new sqlite3.Database('./equipment.db');

// First check if columns exist
db.all("PRAGMA table_info(equipment)", (err, rows) => {
    if (err) {
        console.error('Error:', err);
        return;
    }
    
    console.log('Database columns:');
    rows.forEach(row => console.log(`  ${row.name} (${row.type})`));
    
    const hasModel = rows.find(r => r.name === 'model');
    const hasFiuId = rows.find(r => r.name === 'fiuId');
    
    if (!hasModel || !hasFiuId) {
        console.log('\n❌ Missing columns, adding them...');
        
        const promises = [];
        
        if (!hasModel) {
            promises.push(new Promise((resolve) => {
                db.run("ALTER TABLE equipment ADD COLUMN model TEXT", resolve);
            }));
        }
        
        if (!hasFiuId) {
            promises.push(new Promise((resolve) => {
                db.run("ALTER TABLE equipment ADD COLUMN fiuId TEXT", resolve);
            }));
        }
        
        Promise.all(promises).then(() => {
            console.log('✅ Columns added, testing update...');
            testUpdate();
        });
    } else {
        console.log('\n✅ All columns exist, testing update...');
        testUpdate();
    }
});

function testUpdate() {
    // Get first equipment item
    db.get("SELECT * FROM equipment LIMIT 1", (err, equipment) => {
        if (err || !equipment) {
            console.log('No equipment found');
            db.close();
            return;
        }
        
        console.log(`\nTesting with: ${equipment.name} (ID: ${equipment.id})`);
        
        // Update with test FIU ID
        const testFiuId = 'FIU-TEST-' + Date.now();
        const testModel = 'MODEL-TEST-' + Date.now();
        
        const updateSQL = `
            UPDATE equipment 
            SET model = ?, fiuId = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        db.run(updateSQL, [testModel, testFiuId, equipment.id], function(err) {
            if (err) {
                console.error('❌ Update failed:', err.message);
                db.close();
                return;
            }
            
            console.log('✅ Update successful!');
            
            // Verify the update
            db.get("SELECT name, model, fiuId FROM equipment WHERE id = ?", [equipment.id], (err, result) => {
                if (err) {
                    console.error('Error verifying:', err);
                } else {
                    console.log('\nVerification:');
                    console.log(`  Name: ${result.name}`);
                    console.log(`  Model: ${result.model}`);
                    console.log(`  FIU ID: ${result.fiuId}`);
                    
                    if (result.model === testModel && result.fiuId === testFiuId) {
                        console.log('\n🎉 SUCCESS: Model and FIU ID are saving correctly!');
                        console.log('\nNow try editing this equipment in the web interface:');
                        console.log(`1. Open the browser at http://localhost:3000`);
                        console.log(`2. Find equipment: ${result.name}`);
                        console.log(`3. Click to edit it`);
                        console.log(`4. You should see Model: ${result.model}`);
                        console.log(`5. You should see FIU ID: ${result.fiuId}`);
                        console.log(`6. You should see a barcode for the FIU ID`);
                    } else {
                        console.log('\n❌ FAILED: Data not saved correctly');
                    }
                }
                
                db.close();
            });
        });
    });
}
