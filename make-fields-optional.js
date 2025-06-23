const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Making Buying Date and Price Optional');
console.log('======================================');

const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to database');
        updateOptionalFields();
    }
});

function updateOptionalFields() {
    console.log('🔍 Checking current database schema...');
    
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('❌ Error checking schema:', err.message);
            return;
        }
        
        console.log('\n📋 Current column constraints:');
        rows.forEach(row => {
            if (row.name === 'buyingDate' || row.name === 'price') {
                const required = row.notnull ? 'REQUIRED' : 'OPTIONAL';
                console.log(`   ${row.name}: ${required}`);
            }
        });
        
        const buyingDateField = rows.find(row => row.name === 'buyingDate');
        const priceField = rows.find(row => row.name === 'price');
        
        if (buyingDateField && buyingDateField.notnull === 1) {
            console.log('\n⚠️  buyingDate is currently required');
        }
        if (priceField && priceField.notnull === 1) {
            console.log('⚠️  price is currently required');
        }
        
        console.log('\n🔧 Creating new table structure with optional fields...');
        recreateTableWithOptionalFields();
    });
}

function recreateTableWithOptionalFields() {
    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    
    // Step 1: Create new table with optional fields
    const newTableSQL = `
        CREATE TABLE equipment_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            model TEXT,
            lab TEXT NOT NULL,
            buyingDate TEXT,
            serialNumber TEXT NOT NULL UNIQUE,
            fiuId TEXT,
            quantity INTEGER NOT NULL,
            price REAL,
            status TEXT NOT NULL,
            notes TEXT,
            image TEXT,
            manualLink TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;
    
    db.run(newTableSQL, (err) => {
        if (err) {
            console.error('❌ Error creating new table:', err.message);
            return;
        }
        
        console.log('✅ New table structure created');
        
        // Step 2: Copy data from old table to new table
        const copyDataSQL = `
            INSERT INTO equipment_new (
                id, name, category, model, lab, buyingDate, serialNumber, 
                fiuId, quantity, price, status, notes, image, manualLink, 
                created_at, updated_at
            )
            SELECT 
                id, name, category, model, lab, 
                CASE WHEN buyingDate = '' THEN NULL ELSE buyingDate END,
                serialNumber, fiuId, quantity, 
                CASE WHEN price = 0 THEN NULL ELSE price END,
                status, notes, image, manualLink, created_at, updated_at
            FROM equipment
        `;
        
        db.run(copyDataSQL, function(err) {
            if (err) {
                console.error('❌ Error copying data:', err.message);
                return;
            }
            
            console.log(`✅ Copied ${this.changes} records to new table`);
            
            // Step 3: Drop old table
            db.run("DROP TABLE equipment", (err) => {
                if (err) {
                    console.error('❌ Error dropping old table:', err.message);
                    return;
                }
                
                console.log('✅ Old table dropped');
                
                // Step 4: Rename new table
                db.run("ALTER TABLE equipment_new RENAME TO equipment", (err) => {
                    if (err) {
                        console.error('❌ Error renaming table:', err.message);
                        return;
                    }
                    
                    console.log('✅ Table renamed to equipment');
                    verifyChanges();
                });
            });
        });
    });
}

function verifyChanges() {
    console.log('\n🔍 Verifying updated schema...');
    
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('❌ Error verifying schema:', err.message);
            return;
        }
        
        console.log('\n📋 Updated column constraints:');
        rows.forEach(row => {
            const required = row.notnull ? 'REQUIRED' : 'OPTIONAL';
            const isChanged = (row.name === 'buyingDate' || row.name === 'price') && !row.notnull;
            const indicator = isChanged ? ' 🆕' : '';
            console.log(`   ${row.name}: ${required}${indicator}`);
        });
        
        // Test with optional fields
        testOptionalFields();
    });
}

function testOptionalFields() {
    console.log('\n🧪 Testing optional field functionality...');
    
    // Test inserting equipment without buying date and price
    const testSQL = `
        INSERT INTO equipment (name, category, lab, serialNumber, quantity, status)
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const testData = [
        'Test Equipment - Optional Fields',
        'Test Brand',
        'EC3625',
        'TEST-OPTIONAL-' + Date.now(),
        1,
        'Healthy'
    ];
    
    db.run(testSQL, testData, function(err) {
        if (err) {
            console.error('❌ Test insert failed:', err.message);
        } else {
            console.log('✅ Test insert successful - ID:', this.lastID);
            
            // Verify the test record
            db.get("SELECT name, buyingDate, price FROM equipment WHERE id = ?", [this.lastID], (err, row) => {
                if (err) {
                    console.error('Error retrieving test record:', err);
                } else {
                    console.log('📋 Test record:');
                    console.log(`   Name: ${row.name}`);
                    console.log(`   Buying Date: ${row.buyingDate || 'NULL (optional)'}`);
                    console.log(`   Price: ${row.price || 'NULL (optional)'}`);
                }
                
                // Clean up test record
                db.run("DELETE FROM equipment WHERE id = ?", [this.lastID], (err) => {
                    if (!err) {
                        console.log('✅ Test record cleaned up');
                    }
                    
                    console.log('\n🎉 SUCCESS: Buying Date and Price are now optional!');
                    console.log('\n💡 Updated features:');
                    console.log('   ✅ Buying Date field is optional');
                    console.log('   ✅ Price field is optional');
                    console.log('   ✅ Forms will not require these fields');
                    console.log('   ✅ Equipment can be added without date/price');
                    
                    console.log('\n🚀 Restart your server to apply changes:');
                    console.log('   node server.js');
                    
                    db.close();
                });
            });
        }
    });
}
