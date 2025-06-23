const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Manual Database Update for Model and FIU ID fields');
console.log('==================================================');

// Connect to database
const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to SQLite database.');
        updateDatabase();
    }
});

function updateDatabase() {
    console.log('\n🔍 Step 1: Checking current database structure...');
    
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('❌ Error checking table structure:', err.message);
            return;
        }

        console.log('\n📋 Current columns in equipment table:');
        rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.name} (${row.type}) ${row.notnull ? '- Required' : '- Optional'}`);
        });

        const hasModel = rows.find(row => row.name === 'model');
        const hasFiuId = rows.find(row => row.name === 'fiuId');

        console.log('\n🔍 New fields status:');
        console.log(`   model: ${hasModel ? '✅ EXISTS' : '❌ MISSING'}`);
        console.log(`   fiuId: ${hasFiuId ? '✅ EXISTS' : '❌ MISSING'}`);

        if (!hasModel || !hasFiuId) {
            console.log('\n🔧 Step 2: Adding missing columns...');
            addMissingColumns(hasModel, hasFiuId);
        } else {
            console.log('\n✅ All columns already exist!');
            verifyAndFinish();
        }
    });
}

function addMissingColumns(hasModel, hasFiuId) {
    let operations = [];

    if (!hasModel) {
        operations.push(new Promise((resolve, reject) => {
            db.run("ALTER TABLE equipment ADD COLUMN model TEXT", (err) => {
                if (err) {
                    console.error('❌ Failed to add model column:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Successfully added model column');
                    resolve();
                }
            });
        }));
    }

    if (!hasFiuId) {
        operations.push(new Promise((resolve, reject) => {
            db.run("ALTER TABLE equipment ADD COLUMN fiuId TEXT", (err) => {
                if (err) {
                    console.error('❌ Failed to add fiuId column:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Successfully added fiuId column');
                    resolve();
                }
            });
        }));
    }

    Promise.all(operations)
        .then(() => {
            console.log('\n🎉 All columns added successfully!');
            verifyAndFinish();
        })
        .catch((err) => {
            console.error('❌ Error adding columns:', err);
            db.close();
        });
}

function verifyAndFinish() {
    console.log('\n🔍 Step 3: Verifying updated database structure...');
    
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('❌ Error verifying table structure:', err.message);
            return;
        }

        console.log('\n📋 Updated columns in equipment table:');
        rows.forEach((row, index) => {
            const isNew = (row.name === 'model' || row.name === 'fiuId') ? ' 🆕 NEW' : '';
            console.log(`   ${index + 1}. ${row.name} (${row.type}) ${row.notnull ? '- Required' : '- Optional'}${isNew}`);
        });

        console.log('\n🧪 Step 4: Testing insert with new fields...');
        testInsert();
    });
}

function testInsert() {
    const testData = {
        name: 'Test Equipment ' + Date.now(),
        category: 'Test Brand',
        model: 'TEST-MODEL-' + Date.now(),
        lab: 'EC3625',
        buyingDate: '2024-01-01',
        serialNumber: 'TEST-' + Date.now(),
        fiuId: 'FIU-TEST-' + Date.now(),
        quantity: 1,
        price: 100.00,
        status: 'Healthy',
        notes: 'Test equipment for validation'
    };

    const insertSQL = `
        INSERT INTO equipment (name, category, model, lab, buyingDate, serialNumber, fiuId, quantity, price, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertSQL, [
        testData.name,
        testData.category,
        testData.model,
        testData.lab,
        testData.buyingDate,
        testData.serialNumber,
        testData.fiuId,
        testData.quantity,
        testData.price,
        testData.status,
        testData.notes
    ], function(err) {
        if (err) {
            console.error('❌ Test insert failed:', err.message);
        } else {
            console.log('✅ Test insert successful!');
            console.log(`   - Inserted test equipment with ID: ${this.lastID}`);
            console.log(`   - Model: ${testData.model}`);
            console.log(`   - FIU ID: ${testData.fiuId}`);

            // Verify the data was inserted
            db.get('SELECT * FROM equipment WHERE id = ?', [this.lastID], (err, row) => {
                if (err) {
                    console.error('❌ Error retrieving test data:', err.message);
                } else {
                    console.log('\n📄 Inserted data verification:');
                    console.log(`   - Name: ${row.name}`);
                    console.log(`   - Category: ${row.category}`);
                    console.log(`   - Model: ${row.model}`);
                    console.log(`   - FIU ID: ${row.fiuId}`);
                    console.log(`   - Lab: ${row.lab}`);
                }

                // Clean up test data
                db.run('DELETE FROM equipment WHERE id = ?', [this.lastID], (err) => {
                    if (err) {
                        console.error('❌ Error cleaning up test data:', err.message);
                    } else {
                        console.log('✅ Test data cleaned up');
                    }

                    db.close();
                    console.log('\n🎉 Database update completed successfully!');
                    console.log('📌 Next steps:');
                    console.log('   1. Restart your server: node server.js');
                    console.log('   2. Test adding equipment with Model and FIU ID');
                    console.log('   3. Check the database file to verify data is saved');
                });
            });
        }
    });
}
