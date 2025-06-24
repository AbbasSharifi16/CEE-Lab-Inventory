const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('🖼️  Image Restoration Tool for EC3625 Equipment');
console.log('==============================================');

const db = new sqlite3.Database('./equipment.db');
const uploadsDir = './uploads';

// Get all images in uploads directory
const imageFiles = fs.readdirSync(uploadsDir)
    .filter(file => file.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i))
    .sort();

console.log(`📁 Found ${imageFiles.length} image files in uploads/`);

// Get all EC3625 equipment
db.all(`SELECT * FROM equipment WHERE lab = 'EC3625' ORDER BY name`, (err, equipment) => {
    if (err) {
        console.error('❌ Error querying equipment:', err.message);
        db.close();
        return;
    }

    console.log(`🔬 Found ${equipment.length} equipment items in EC3625`);
    console.log('');
    console.log('📋 Equipment List:');
    console.log('==================');
    
    equipment.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} (ID: ${item.id})`);
        console.log(`   Brand: ${item.category}`);
        console.log(`   Serial: ${item.serialNumber}`);
        console.log(`   Current Image: ${item.image || 'None'}`);
        console.log('');
    });

    console.log('🖼️  Available Images:');
    console.log('===================');
    imageFiles.forEach((file, index) => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        const date = stats.mtime.toISOString().slice(0, 19).replace('T', ' ');
        console.log(`${index + 1}. ${file} (Modified: ${date})`);
    });
    
    console.log('');
    console.log('💡 Next Steps:');
    console.log('==============');
    console.log('1. Start the server: node server.js');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Go to each EC3625 equipment item');
    console.log('4. Click "Edit" and manually re-upload the images');
    console.log('');
    console.log('🔧 Or create an automated restoration script if you have');
    console.log('   a mapping of which image belongs to which equipment.');
    
    db.close();
});
