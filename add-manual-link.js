const sqlite3 = require('sqlite3').verbose();

console.log('🔧 Adding Manual Link Column to Database');
console.log('========================================');

const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to database');
        checkAndAddColumn();
    }
});

function checkAndAddColumn() {
    console.log('🔍 Checking current database schema...');
    
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('❌ Error checking schema:', err.message);
            return;
        }
        
        console.log('\n📋 Current database columns:');
        rows.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.name} (${row.type}) ${row.notnull ? '- Required' : '- Optional'}`);
        });
        
        const hasManualLink = rows.find(row => row.name === 'manualLink');
        
        console.log('\n🔍 Manual Link column status:');
        console.log(`   manualLink: ${hasManualLink ? '✅ EXISTS' : '❌ MISSING'}`);
        
        if (!hasManualLink) {
            console.log('\n🔧 Adding manualLink column...');
            addManualLinkColumn();
        } else {
            console.log('\n✅ ManualLink column already exists!');
            testManualLink();
        }
    });
}

function addManualLinkColumn() {
    db.run("ALTER TABLE equipment ADD COLUMN manualLink TEXT", (err) => {
        if (err) {
            console.error('❌ Failed to add manualLink column:', err.message);
            db.close();
            return;
        }
        
        console.log('✅ Successfully added manualLink column');
        verifyColumn();
    });
}

function verifyColumn() {
    console.log('\n🔍 Verifying updated database structure...');
    
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('❌ Error verifying schema:', err.message);
            return;
        }
        
        console.log('\n📋 Updated database columns:');
        rows.forEach((row, index) => {
            const isNew = (row.name === 'manualLink') ? ' 🆕 NEW' : '';
            console.log(`   ${index + 1}. ${row.name} (${row.type}) ${row.notnull ? '- Required' : '- Optional'}${isNew}`);
        });
        
        testManualLink();
    });
}

function testManualLink() {
    console.log('\n🧪 Testing manual link functionality...');
    
    // Get first equipment item to test with
    db.get("SELECT * FROM equipment LIMIT 1", (err, equipment) => {
        if (err || !equipment) {
            console.log('ℹ️  No equipment found for testing');
            db.close();
            return;
        }
        
        console.log(`\nTesting with: ${equipment.name} (ID: ${equipment.id})`);
        
        // Test manual link update
        const testManualLink = 'https://example.com/manual.pdf';
        
        const updateSQL = `
            UPDATE equipment 
            SET manualLink = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `;
        
        db.run(updateSQL, [testManualLink, equipment.id], function(err) {
            if (err) {
                console.error('❌ Test update failed:', err.message);
                db.close();
                return;
            }
            
            console.log('✅ Test update successful!');
            
            // Verify the update
            db.get("SELECT name, manualLink FROM equipment WHERE id = ?", [equipment.id], (err, result) => {
                if (err) {
                    console.error('Error verifying update:', err);
                } else {
                    console.log('\n📋 Verification:');
                    console.log(`   Equipment: ${result.name}`);
                    console.log(`   Manual Link: ${result.manualLink}`);
                    
                    if (result.manualLink === testManualLink) {
                        console.log('\n🎉 SUCCESS: Manual link field is working correctly!');
                        console.log('\n💡 Features now available:');
                        console.log('   ✅ Manual link field in equipment forms');
                        console.log('   ✅ QR code generation for manual links');
                        console.log('   ✅ Printable QR codes for equipment labeling');
                        console.log('   ✅ Direct links to equipment manuals');
                        
                        // Clean up test data
                        db.run("UPDATE equipment SET manualLink = NULL WHERE id = ?", [equipment.id], (err) => {
                            if (!err) {
                                console.log('   ✅ Test data cleaned up');
                            }
                            
                            console.log('\n🚀 Ready to use! Restart your server:');
                            console.log('   node server.js');
                            console.log('\n🌐 Then test at: http://localhost:3000');
                            
                            db.close();
                        });
                    } else {
                        console.log('\n❌ FAILED: Manual link not saved correctly');
                        db.close();
                    }
                }
            });
        });
    });
}
