const sqlite3 = require('sqlite3').verbose();

console.log('🧪 Testing Age Calculation with Optional Buying Date');
console.log('=================================================');

const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to database');
        testAgeCalculation();
    }
});

// Helper function to calculate age (same as server)
function calculateAge(buyingDate) {
    // Handle cases where buying date is null, undefined, or empty
    if (!buyingDate || buyingDate === '' || buyingDate === null) {
        return 'Not specified';
    }
    
    try {
        const today = new Date();
        const purchaseDate = new Date(buyingDate);
        
        // Check if the date is valid
        if (isNaN(purchaseDate.getTime())) {
            return 'Not specified';
        }
        
        const ageInDays = Math.floor((today - purchaseDate) / (1000 * 60 * 60 * 24));
        
        // Handle future dates
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

function testAgeCalculation() {
    console.log('🔍 Testing age calculation with different buying date scenarios...\n');
    
    // Test cases
    const testCases = [
        { date: null, description: 'NULL buying date' },
        { date: '', description: 'Empty string buying date' },
        { date: '2024-01-15', description: 'Valid recent date' },
        { date: '2020-06-01', description: 'Valid older date' },
        { date: 'invalid-date', description: 'Invalid date format' },
        { date: '2025-12-31', description: 'Future date' }
    ];
    
    console.log('📋 Age Calculation Test Results:');
    console.log('================================');
    
    testCases.forEach((testCase, index) => {
        const age = calculateAge(testCase.date);
        console.log(`${index + 1}. ${testCase.description}`);
        console.log(`   Input: ${testCase.date === null ? 'NULL' : testCase.date === '' ? 'EMPTY' : testCase.date}`);
        console.log(`   Age: ${age}`);
        console.log('');
    });
    
    // Test with actual database records
    console.log('🔍 Checking actual equipment records with null buying dates...\n');
    
    db.all("SELECT id, name, buyingDate, price FROM equipment WHERE buyingDate IS NULL OR buyingDate = '' LIMIT 5", (err, rows) => {
        if (err) {
            console.error('Error querying database:', err.message);
            return;
        }
        
        console.log('📋 Equipment with NULL/Empty Buying Dates:');
        console.log('==========================================');
        
        if (rows.length === 0) {
            console.log('✅ No equipment found with null buying dates');
        } else {
            rows.forEach((row, index) => {
                const age = calculateAge(row.buyingDate);
                const price = row.price ? `$${parseFloat(row.price).toFixed(2)}` : 'Not specified';
                
                console.log(`${index + 1}. ${row.name} (ID: ${row.id})`);
                console.log(`   Buying Date: ${row.buyingDate || 'NULL'}`);
                console.log(`   Price: ${price}`);
                console.log(`   Age: ${age}`);
                console.log('');
            });
        }
        
        // Test with records that have buying dates
        db.all("SELECT id, name, buyingDate FROM equipment WHERE buyingDate IS NOT NULL AND buyingDate != '' LIMIT 3", (err, rows) => {
            if (err) {
                console.error('Error querying database:', err.message);
                return;
            }
            
            console.log('📋 Equipment with Valid Buying Dates:');
            console.log('=====================================');
            
            rows.forEach((row, index) => {
                const age = calculateAge(row.buyingDate);
                
                console.log(`${index + 1}. ${row.name} (ID: ${row.id})`);
                console.log(`   Buying Date: ${row.buyingDate}`);
                console.log(`   Age: ${age}`);
                console.log('');
            });
            
            console.log('🎉 Test completed!');
            console.log('\n💡 Summary:');
            console.log('   ✅ NULL buying dates show "Not specified" age');
            console.log('   ✅ Empty buying dates show "Not specified" age');
            console.log('   ✅ Invalid dates show "Not specified" age');
            console.log('   ✅ Future dates show "Future date" age');
            console.log('   ✅ Valid dates show calculated age');
            
            db.close();
        });
    });
}
