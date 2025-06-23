const sqlite3 = require('sqlite3').verbose();

console.log('🔍 Checking Current Equipment Data and Ages');
console.log('==========================================');

const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to database');
        checkCurrentData();
    }
});

// Same calculateAge function as server
function calculateAge(buyingDate) {
    if (!buyingDate || buyingDate === '' || buyingDate === null || buyingDate === undefined) {
        return 'Not specified';
    }
    
    try {
        const today = new Date();
        const purchaseDate = new Date(buyingDate);
        
        if (isNaN(purchaseDate.getTime())) {
            return 'Not specified';
        }
        
        const ageInDays = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
        
        if (ageInDays < 0) {
            return 'Future date';
        }
        
        const ageInYears = Math.floor(ageInDays / 365);
        const remainingDays = ageInDays % 365;
        const ageInMonths = Math.floor(remainingDays / 30);
        
        if (ageInYears > 0) {
            return `${ageInYears} year${ageInYears > 1 ? 's' : ''}, ${ageInMonths} month${ageInMonths > 1 ? 's' : ''}`;
        } else if (ageInMonths > 0) {
            return `${ageInMonths} month${ageInMonths > 1 ? 's' : ''}`;
        } else {
            return `${ageInDays} day${ageInDays > 1 ? 's' : ''}`;
        }
    } catch (error) {
        console.error('Error calculating age for date:', buyingDate, error);
        return 'Not specified';
    }
}

function checkCurrentData() {
    console.log('📋 Current Equipment Data (First 10 records):');
    console.log('=============================================\n');
    
    db.all("SELECT id, name, buyingDate, price FROM equipment LIMIT 10", (err, rows) => {
        if (err) {
            console.error('Error querying database:', err.message);
            return;
        }
        
        rows.forEach((row, index) => {
            const age = calculateAge(row.buyingDate);
            const price = row.price ? `$${parseFloat(row.price).toFixed(2)}` : 'Not specified';
            
            console.log(`${index + 1}. ${row.name} (ID: ${row.id})`);
            console.log(`   Buying Date: ${row.buyingDate || 'NULL'}`);
            console.log(`   Price: ${price}`);
            console.log(`   Age: ${age}`);
            console.log('');
        });
        
        // Check which records have weird ages
        db.all("SELECT id, name, buyingDate FROM equipment WHERE buyingDate IS NOT NULL", (err, rows) => {
            if (err) {
                console.error('Error:', err.message);
                return;
            }
            
            console.log('\n📋 Equipment WITH buying dates:');
            console.log('===============================');
            
            if (rows.length === 0) {
                console.log('No equipment has buying dates set');
            } else {
                rows.forEach(row => {
                    const age = calculateAge(row.buyingDate);
                    console.log(`${row.name}: ${row.buyingDate} → ${age}`);
                });
            }
            
            // Check total counts
            db.get("SELECT COUNT(*) as total FROM equipment", (err, result) => {
                if (!err) {
                    console.log(`\n📊 Total equipment: ${result.total}`);
                }
                
                db.get("SELECT COUNT(*) as nullDates FROM equipment WHERE buyingDate IS NULL", (err, result) => {
                    if (!err) {
                        console.log(`📊 Equipment with NULL buying dates: ${result.nullDates}`);
                    }
                    
                    db.get("SELECT COUNT(*) as withDates FROM equipment WHERE buyingDate IS NOT NULL", (err, result) => {
                        if (!err) {
                            console.log(`📊 Equipment with buying dates: ${result.withDates}`);
                        }
                        
                        console.log('\n💡 If you\'re still seeing "55 years and 6 months", it might be:');
                        console.log('   1. Browser cache - try hard refresh (Ctrl+F5)');
                        console.log('   2. Old data in browser storage');
                        console.log('   3. Network cache');
                        console.log('\n🔄 To force refresh: Close browser completely and reopen');
                        
                        db.close();
                    });
                });
            });
        });
    });
}
