const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static('.'));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'equipment-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Initialize SQLite Database
const db = new sqlite3.Database('./equipment.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        initializeDatabase();
    }
});

// Create tables and insert initial data
function initializeDatabase() {
    console.log('🔧 Initializing database...');
    
    const createTableSQL = `        CREATE TABLE IF NOT EXISTS equipment (
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

    db.run(createTableSQL, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        } else {
            console.log('Equipment table ready.');
            // Force add new columns even if table exists
            forceAddNewColumns();
        }
    });
}

// Force add new columns (handles existing databases)
function forceAddNewColumns() {
    console.log('🔧 Ensuring Model and FIU ID columns exist...');
    
    // Check current schema first
    db.all("PRAGMA table_info(equipment)", (err, rows) => {
        if (err) {
            console.error('Error checking schema:', err.message);
            return;
        }
          const hasModel = rows.find(row => row.name === 'model');
        const hasFiuId = rows.find(row => row.name === 'fiuId');
        const hasManualLink = rows.find(row => row.name === 'manualLink');
        
        console.log('Current columns:', rows.map(r => r.name).join(', '));
        console.log(`Model column exists: ${hasModel ? 'YES' : 'NO'}`);
        console.log(`FiuId column exists: ${hasFiuId ? 'YES' : 'NO'}`);
        console.log(`ManualLink column exists: ${hasManualLink ? 'YES' : 'NO'}`);
        
        let columnsToAdd = [];
        
        if (!hasModel) {
            columnsToAdd.push('model');
        }
        if (!hasFiuId) {
            columnsToAdd.push('fiuId');
        }
        if (!hasManualLink) {
            columnsToAdd.push('manualLink');
        }
        
        if (columnsToAdd.length > 0) {
            addColumnsSequentially(columnsToAdd, 0);
        } else {
            console.log('✅ All required columns exist');
            insertInitialData();
        }
    });
}

function addColumnsSequentially(columns, index) {
    if (index >= columns.length) {
        console.log('✅ All columns added successfully');
        insertInitialData();
        return;
    }
    
    const column = columns[index];
    const sql = `ALTER TABLE equipment ADD COLUMN ${column} TEXT`;
    
    console.log(`Adding column: ${column}`);
    
    db.run(sql, (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error(`❌ Error adding ${column} column:`, err.message);
        } else {
            console.log(`✅ Added ${column} column`);
        }
        
        // Add next column
        addColumnsSequentially(columns, index + 1);
    });
}

// Insert initial data from data.js if table is empty
function insertInitialData() {
    db.get("SELECT COUNT(*) as count FROM equipment", (err, row) => {
        if (err) {
            console.error('Error checking table:', err.message);
            return;
        }

        if (row.count === 0) {
            console.log('Inserting initial equipment data...');
            
            // Import initial data from data.js
            const initialData = require('./data.js');
              const insertSQL = `
                INSERT INTO equipment (name, category, model, lab, buyingDate, serialNumber, fiuId, quantity, price, status, notes, image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const stmt = db.prepare(insertSQL);
            
            initialData.forEach((item) => {                stmt.run([
                    item.name,
                    item.category,
                    item.model || null,
                    item.lab,
                    item.buyingDate,
                    item.serialNumber,
                    item.fiuId || null,
                    item.quantity,
                    item.price,
                    item.status,
                    item.notes || '',
                    item.image || null
                ], (err) => {
                    if (err) {
                        console.error('Error inserting initial data:', err.message);
                    }
                });
            });
            
            stmt.finalize((err) => {
                if (err) {
                    console.error('Error finalizing statement:', err.message);
                } else {
                    console.log('Initial data inserted successfully.');
                }
            });
        }
    });
}

// Helper function to calculate age
function calculateAge(buyingDate) {
    // Handle cases where buying date is null, undefined, or empty
    if (!buyingDate || buyingDate === '' || buyingDate === null || buyingDate === undefined) {
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

// API Routes

// Get all equipment
app.get('/api/equipment', (req, res) => {
    const { lab, status, search } = req.query;
    
    let sql = 'SELECT * FROM equipment WHERE 1=1';
    const params = [];
    
    if (lab) {
        sql += ' AND lab = ?';
        params.push(lab);
    }
    
    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }
    
    if (search) {
        sql += ' AND (name LIKE ? OR category LIKE ? OR serialNumber LIKE ? OR notes LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    db.all(sql, params, (err, rows) => {
        if (err) {
            console.error('Error fetching equipment:', err.message);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        // Add calculated age to each item
        const equipmentWithAge = rows.map(item => ({
            ...item,
            age: calculateAge(item.buyingDate)
        }));
        
        res.json(equipmentWithAge);
    });
});

// Get single equipment by ID
app.get('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT * FROM equipment WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching equipment:', err.message);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Equipment not found' });
            return;
        }
        
        // Add calculated age
        const equipmentWithAge = {
            ...row,
            age: calculateAge(row.buyingDate)
        };
        
        res.json(equipmentWithAge);
    });
});

// Add new equipment
app.post('/api/equipment', upload.single('image'), (req, res) => {
    console.log('Received POST request body:', req.body);
      const {
        name,
        category,
        model,
        lab,
        buyingDate,
        serialNumber,
        fiuId,
        quantity,
        price,
        status,
        notes,
        manualLink
    } = req.body;
    
    console.log('Extracted fields:');
    console.log('- name:', name);
    console.log('- category:', category);
    console.log('- model:', model);
    console.log('- fiuId:', fiuId);
    console.log('- manualLink:', manualLink);
    console.log('- lab:', lab);
      // Validate required fields (buyingDate and price are now optional)
    if (!name || !category || !lab || !serialNumber || !quantity || !status) {
        console.log('Missing required fields');
        return res.status(400).json({ error: 'Missing required fields. Required: name, category, lab, serialNumber, quantity, status' });
    }
    
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
      const insertSQL = `
        INSERT INTO equipment (name, category, model, lab, buyingDate, serialNumber, fiuId, quantity, price, status, notes, image, manualLink)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    console.log('About to insert with values:', [
        name, category, model || null, lab, buyingDate, serialNumber, fiuId || null, quantity, price, status, notes || '', imagePath, manualLink || null
    ]);
    
    db.run(insertSQL, [
        name,        category,
        model || null,
        lab,
        buyingDate || null,
        serialNumber,
        fiuId || null,
        parseInt(quantity),
        price ? parseFloat(price) : null,
        status,
        notes || '',
        imagePath,
        manualLink || null
    ], function(err) {
        if (err) {
            console.error('Error inserting equipment:', err.message);
            if (err.message.includes('UNIQUE constraint failed')) {
                res.status(400).json({ error: 'Serial number already exists' });
            } else {
                res.status(500).json({ error: 'Database error' });
            }
            return;
        }
        
        // Fetch the inserted record
        db.get('SELECT * FROM equipment WHERE id = ?', [this.lastID], (err, row) => {
            if (err) {
                console.error('Error fetching inserted equipment:', err.message);
                res.status(500).json({ error: 'Database error' });
                return;
            }
            
            const equipmentWithAge = {
                ...row,
                age: calculateAge(row.buyingDate)
            };
            
            res.status(201).json(equipmentWithAge);
        });
    });
});

// Update equipment
app.put('/api/equipment/:id', upload.single('image'), (req, res) => {
    const { id } = req.params;
    console.log('Received PUT request for ID:', id);
    console.log('Request body:', req.body);
      const {
        name,
        category,
        model,
        lab,
        buyingDate,
        serialNumber,
        fiuId,
        quantity,
        price,
        status,
        notes,
        manualLink
    } = req.body;
    
    console.log('Extracted fields for update:');
    console.log('- name:', name);
    console.log('- category:', category);
    console.log('- model:', model);
    console.log('- fiuId:', fiuId);
    console.log('- manualLink:', manualLink);
    console.log('- lab:', lab);
    
    let imagePath = null;
    if (req.file) {
        imagePath = `/uploads/${req.file.filename}`;
        console.log('New image uploaded:', imagePath);
    } else if (req.body.keepImage === 'true') {
        // Keep existing image
        imagePath = req.body.currentImage;
        console.log('Keeping existing image:', imagePath);
    }
      const updateSQL = `
        UPDATE equipment 
        SET name = ?, category = ?, model = ?, lab = ?, buyingDate = ?, serialNumber = ?, fiuId = ?,
            quantity = ?, price = ?, status = ?, notes = ?, image = ?, manualLink = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
      console.log('About to update with values:', [
        name, category, model || null, lab, buyingDate || null, serialNumber, fiuId || null, parseInt(quantity), price ? parseFloat(price) : null, status, notes || '', imagePath, manualLink || null, id
    ]);
    
    db.run(updateSQL, [
        name,
        category,
        model || null,
        lab,
        buyingDate || null,
        serialNumber,
        fiuId || null,
        parseInt(quantity),
        price ? parseFloat(price) : null,
        status,
        notes || '',
        imagePath,
        manualLink || null,
        id
    ], function(err) {
        if (err) {
            console.error('Error updating equipment:', err.message);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Equipment not found' });
            return;
        }
        
        // Fetch the updated record
        db.get('SELECT * FROM equipment WHERE id = ?', [id], (err, row) => {
            if (err) {
                console.error('Error fetching updated equipment:', err.message);
                res.status(500).json({ error: 'Database error' });
                return;
            }
            
            const equipmentWithAge = {
                ...row,
                age: calculateAge(row.buyingDate)
            };
            
            res.json(equipmentWithAge);
        });
    });
});

// Delete equipment
app.delete('/api/equipment/:id', (req, res) => {
    const { id } = req.params;
    
    // First get the equipment to delete associated image
    db.get('SELECT image FROM equipment WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching equipment for deletion:', err.message);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Equipment not found' });
            return;
        }
        
        // Delete from database
        db.run('DELETE FROM equipment WHERE id = ?', [id], function(err) {
            if (err) {
                console.error('Error deleting equipment:', err.message);
                res.status(500).json({ error: 'Database error' });
                return;
            }
            
            // Delete associated image file if exists
            if (row.image && row.image.startsWith('/uploads/')) {
                const imagePath = path.join(__dirname, row.image);
                fs.unlink(imagePath, (err) => {
                    if (err) {
                        console.error('Error deleting image file:', err.message);
                    }
                });
            }
            
            res.json({ message: 'Equipment deleted successfully' });
        });
    });
});

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
        }
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 CEE Lab Equipment Manager server running on http://localhost:${PORT}`);
    console.log(`📊 Database: SQLite (equipment.db)`);
    console.log(`📁 Static files served from current directory`);
    console.log(`🖼️  Image uploads stored in: ./uploads/`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});
