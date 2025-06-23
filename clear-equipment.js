const sqlite3 = require('sqlite3').verbose();

console.log('🗑️  Equipment Database Cleanup Tool');
console.log('===================================');

// Connect to database
const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error connecting to database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to database');
        checkExistingData();
    }
});

function checkExistingData() {
    // First, let's see what's currently in the database
    db.get("SELECT COUNT(*) as count FROM equipment", (err, row) => {
        if (err) {
            console.error('❌ Error checking existing data:', err.message);
            db.close();
            return;
        }
        
        const count = row.count;
        console.log(`📊 Current equipment count: ${count} items`);
        
        if (count === 0) {
            console.log('✅ Database is already empty - no cleanup needed');
            db.close();
            return;
        }
        
        // Show some existing data
        console.log('\n📋 Existing equipment (first 5 items):');
        db.all("SELECT id, name, category, lab FROM equipment LIMIT 5", (err, rows) => {
            if (err) {
                console.error('Error fetching sample data:', err);
            } else {
                rows.forEach(row => {
                    console.log(`   ${row.id}. ${row.name} (${row.category}) - Lab ${row.lab}`);
                });
                
                if (count > 5) {
                    console.log(`   ... and ${count - 5} more items`);
                }
            }
            
            console.log('\n⚠️  WARNING: This will DELETE ALL existing equipment data!');
            console.log('📝 This action cannot be undone.');
            console.log('💾 Consider backing up your database file first.');
            console.log('');
            
            // Proceed with deletion
            clearAllData();
        });
    });
}

function clearAllData() {
    console.log('🗑️  Clearing all equipment data...');
    
    // Delete all equipment records
    db.run("DELETE FROM equipment", function(err) {
        if (err) {
            console.error('❌ Error clearing data:', err.message);
            db.close();
            return;
        }
        
        console.log(`✅ Deleted ${this.changes} equipment records`);
        
        // Reset the auto-increment counter
        db.run("DELETE FROM sqlite_sequence WHERE name='equipment'", (err) => {
            if (err) {
                console.log('ℹ️  Note: Could not reset ID counter (this is normal for new databases)');
            } else {
                console.log('✅ Reset ID counter - new equipment will start from ID 1');
            }
            
            // Verify the cleanup
            verifyCleanup();
        });
    });
}

function verifyCleanup() {
    console.log('\n🔍 Verifying cleanup...');
    
    db.get("SELECT COUNT(*) as count FROM equipment", (err, row) => {
        if (err) {
            console.error('❌ Error verifying cleanup:', err.message);
        } else {
            const count = row.count;
            if (count === 0) {
                console.log('✅ Cleanup successful - database is now empty');
                console.log('');
                console.log('🎉 Database is ready for fresh equipment data!');
                console.log('📥 You can now run the import script:');
                console.log('   node import-equipment.js');
                console.log('   OR double-click: import-equipment.bat');
                console.log('');
                console.log('📋 Database structure maintained:');
                
                // Show the current table structure
                db.all("PRAGMA table_info(equipment)", (err, rows) => {
                    if (err) {
                        console.error('Error checking table structure:', err);
                    } else {
                        rows.forEach(row => {
                            const required = row.notnull ? ' (required)' : ' (optional)';
                            console.log(`   - ${row.name}: ${row.type}${required}`);
                        });
                    }
                    
                    db.close();
                    console.log('\n🔐 Database connection closed');
                });
            } else {
                console.log(`❌ Cleanup failed - ${count} items still remain`);
                db.close();
            }
        }
    });
}
