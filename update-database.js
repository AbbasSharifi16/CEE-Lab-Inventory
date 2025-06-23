const sqlite3 = require('sqlite3').verbose();

console.log('🔄 Adding new fields (Model, FIU ID) to existing database...');

// Connect to database
const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to SQLite database.');
        addNewFields();
    }
});

function addNewFields() {
    let fieldsAdded = 0;
    
    // Add model column
    db.run("ALTER TABLE equipment ADD COLUMN model TEXT", (err) => {
        if (err && !err.message.includes('duplicate column name')) {
            console.error('❌ Error adding model column:', err.message);
        } else if (!err) {
            console.log('✅ Added "model" field to database');
            fieldsAdded++;
        } else {
            console.log('ℹ️  "model" field already exists');
        }
        
        // Add fiuId column
        db.run("ALTER TABLE equipment ADD COLUMN fiuId TEXT", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('❌ Error adding fiuId column:', err.message);
            } else if (!err) {
                console.log('✅ Added "fiuId" field to database');
                fieldsAdded++;
            } else {
                console.log('ℹ️  "fiuId" field already exists');
            }
            
            finishUpdate(fieldsAdded);
        });
    });
}

function finishUpdate(fieldsAdded) {
    console.log('\n📊 Database Update Summary:');
    console.log(`✅ Fields added: ${fieldsAdded}`);
    
    if (fieldsAdded > 0) {
        console.log('\n🎉 Database updated successfully!');
        console.log('📝 New fields added:');
        console.log('   - model: For equipment model numbers');
        console.log('   - fiuId: For FIU identification numbers');
    } else {
        console.log('\n✅ Database already up to date!');
    }
    
    // Verify the update
    verifyFields();
}

function verifyFields() {
    console.log('\n🔍 Verifying database structure...');
    
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('❌ Error verifying database structure:', err.message);
        } else {
            console.log('\n📋 Current database fields:');
            rows.forEach(row => {
                const required = row.notnull ? ' (required)' : ' (optional)';
                const newField = (row.name === 'model' || row.name === 'fiuId') ? ' 🆕' : '';
                console.log(`   ${row.name}: ${row.type}${required}${newField}`);
            });
            
            console.log('\n✨ Database structure verification complete!');
            console.log('🚀 You can now restart your server to use the new fields.');
        }
        
        // Close database connection
        db.close((err) => {
            if (err) {
                console.error('❌ Error closing database:', err.message);
            } else {
                console.log('\n🔐 Database connection closed.');
            }
        });
    });
}
