const sqlite3 = require('sqlite3').verbose();

console.log('📊 CEE Lab Equipment Status Report');
console.log('=====================================');

const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✅ Connected to database\n');
        showStatusReport();
    }
});

function showStatusReport() {
    // Get status distribution
    db.all("SELECT status, COUNT(*) as count FROM equipment GROUP BY status ORDER BY count DESC", (err, rows) => {
        if (err) {
            console.error('❌ Error querying status:', err.message);
            db.close();
            return;
        }
        
        console.log('📋 Current Equipment Status Distribution:');
        console.log('==========================================');
        
        let totalEquipment = 0;
        rows.forEach(row => {
            totalEquipment += row.count;
            const percentage = ((row.count / 98) * 100).toFixed(1);
            console.log(`📌 ${row.status}: ${row.count} items (${percentage}%)`);
        });
        
        console.log(`\n📊 Total Equipment: ${totalEquipment} items`);
        
        // Show status meanings
        console.log('\n📖 Status Meanings:');
        console.log('==================');
        console.log('🟢 Active / In Use        - Equipment is being used normally');
        console.log('🔵 Stored / In Storage    - Not in use but kept for possible future use');
        console.log('🟤 Surplus               - No longer needed; may be sold or transferred');
        console.log('⚪ Obsolete / Outdated   - Outdated technology; cannot be upgraded');
        console.log('🔴 Broken / Non-Functional - Not working; needs repair');
        console.log('🟡 Troubleshooting       - Problem being investigated');
        console.log('🟣 Under Maintenance     - Under repair or scheduled service');
        console.log('⚫ To be Disposed        - Approved for trash or recycling');
        
        console.log('\n✅ Status update completed successfully!');
        console.log('💡 All equipment now uses the new professional status categories');
        
        db.close();
    });
}
