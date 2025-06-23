const sqlite3 = require('sqlite3').verbose();

console.log('🔍 Checking database schema...');

const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to database');
        checkSchema();
    }
});

function checkSchema() {
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('❌ Error checking schema:', err.message);
        } else {
            console.log('\n📋 Current database schema:');
            rows.forEach(row => {
                console.log(`   ${row.name}: ${row.type} ${row.notnull ? '(NOT NULL)' : '(NULLABLE)'}`);
            });
            
            // Check if model and fiuId columns exist
            const hasModel = rows.find(row => row.name === 'model');
            const hasFiuId = rows.find(row => row.name === 'fiuId');
            
            console.log('\n🔍 New fields status:');
            console.log(`   model: ${hasModel ? '✅ EXISTS' : '❌ MISSING'}`);
            console.log(`   fiuId: ${hasFiuId ? '✅ EXISTS' : '❌ MISSING'}`);
            
            if (!hasModel || !hasFiuId) {
                console.log('\n🔧 Adding missing columns...');
                addMissingColumns();
            } else {
                console.log('\n✅ All columns exist!');
                testInsert();
            }
        }
    });
}

function addMissingColumns() {
    let addedCount = 0;
    
    db.run("ALTER TABLE equipment ADD COLUMN model TEXT", (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('❌ Error adding model column:', err.message);
        } else if (!err) {
            console.log('✅ Added model column');
            addedCount++;
        }
        
        db.run("ALTER TABLE equipment ADD COLUMN fiuId TEXT", (err) => {
            if (err && !err.message.includes('duplicate column')) {
                console.error('❌ Error adding fiuId column:', err.message);
            } else if (!err) {
                console.log('✅ Added fiuId column');
                addedCount++;
            }
            
            console.log(`\n📊 Added ${addedCount} columns`);
            testInsert();
        });
    });
}

function testInsert() {
    console.log('\n🧪 Testing insert with new fields...');
    
    const testSQL = `
        INSERT INTO equipment (name, category, model, lab, buyingDate, serialNumber, fiuId, quantity, price, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(testSQL, [
        'Test Equipment',
        'Test Brand',
        'TEST-MODEL-123',
        'EC3625',
        '2024-01-01',
        'TEST-SERIAL-' + Date.now(),
        'FIU-TEST-456',
        1,
        100.00,
        'Healthy',
        'Test equipment for schema validation'
    ], function(err) {
        if (err) {
            console.error('❌ Test insert failed:', err.message);
        } else {
            console.log('✅ Test insert successful! ID:', this.lastID);
            
            // Clean up test data
            db.run('DELETE FROM equipment WHERE id = ?', [this.lastID], (err) => {
                if (err) {
                    console.error('❌ Error cleaning up test data:', err.message);
                } else {
                    console.log('✅ Test data cleaned up');
                }
                
                db.close();
                console.log('\n🎉 Database schema is ready for Model and FIU ID fields!');
            });
        }
    });
}
