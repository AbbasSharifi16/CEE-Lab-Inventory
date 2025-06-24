const fs = require('fs');

console.log('🔄 Equipment JSON Combiner Tool');
console.log('===============================');

// Define the files to combine
const files = [
    'equipment_import_EC3625.json',
    'equipment_import_EC3765_OU107.json', 
    'equipment_import_EC3760.json'
];

let combinedEquipment = [];
let totalCount = 0;

// Read and combine all files
files.forEach(filename => {
    if (fs.existsSync(filename)) {
        try {
            const rawData = fs.readFileSync(filename, 'utf8');
            const equipmentData = JSON.parse(rawData);
            
            console.log(`✅ Loaded ${equipmentData.length} items from ${filename}`);
            combinedEquipment = combinedEquipment.concat(equipmentData);
            totalCount += equipmentData.length;
            
        } catch (error) {
            console.error(`❌ Error reading ${filename}:`, error.message);
        }
    } else {
        console.log(`⚠️  File not found: ${filename}`);
    }
});

console.log('');
console.log(`📊 Combined Summary:`);
console.log(`   Total equipment items: ${totalCount}`);

// Check for duplicate serial numbers and handle them
const serialNumbers = new Map();
let duplicateCount = 0;

combinedEquipment.forEach((item, index) => {
    if (serialNumbers.has(item.serialNumber)) {
        // Handle duplicate serial number
        const originalIndex = serialNumbers.get(item.serialNumber);
        let counter = 1;
        let newSerial = `${item.serialNumber}-DUP${counter}`;
        
        while (serialNumbers.has(newSerial)) {
            counter++;
            newSerial = `${item.serialNumber}-DUP${counter}`;
        }
        
        console.log(`🔄 Duplicate serial "${item.serialNumber}" → "${newSerial}" (Item ${index + 1})`);
        item.serialNumber = newSerial;
        duplicateCount++;
    }
    serialNumbers.set(item.serialNumber, index);
});

if (duplicateCount > 0) {
    console.log(`⚠️  Resolved ${duplicateCount} duplicate serial numbers`);
}

// Create backup of existing equipment_import.json if it exists
const outputFile = 'equipment_import.json';
if (fs.existsSync(outputFile)) {
    const backupFile = `${outputFile}.backup.${Date.now()}`;
    console.log(`💾 Creating backup: ${backupFile}`);
    fs.copyFileSync(outputFile, backupFile);
}

// Write combined data to equipment_import.json
try {
    fs.writeFileSync(outputFile, JSON.stringify(combinedEquipment, null, 2));
    console.log('');
    console.log('🎉 Successfully created combined equipment_import.json!');
    console.log(`📁 File location: ${__dirname}\\${outputFile}`);
    console.log(`📊 Total items: ${combinedEquipment.length}`);
    console.log('');
    console.log('✅ Ready for import with: node import-equipment.js --clear');
    
} catch (error) {
    console.error('❌ Error writing combined file:', error.message);
    process.exit(1);
}
