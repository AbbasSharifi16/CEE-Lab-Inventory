const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Email configuration (you'll need to configure this with your SMTP settings)
const emailConfig = {
    service: 'gmail', // Change this to your email service
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-app-password'
    }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(session({
    secret: JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set to true in production with HTTPS
}));
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
const db = new Database('./equipment.db');

// Initialize database
console.log('Connected to SQLite database.');
initializeDatabase();

// Create tables and insert initial data
function initializeDatabase() {
    console.log('🔧 Initializing database...');
    
    // Create equipment table
    const createEquipmentTableSQL = `        CREATE TABLE IF NOT EXISTS equipment (
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

    // Create users table
    const createUsersTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            firstName TEXT NOT NULL,
            lastName TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            pantherId TEXT NOT NULL UNIQUE,
            phoneNumber TEXT,
            password TEXT,
            role TEXT NOT NULL CHECK(role IN ('admin', 'grant', 'faculty')),
            authorizedLabs TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('active', 'pending', 'inactive')),
            setupToken TEXT,
            setupTokenExpiry DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `;

    try {
        db.exec(createEquipmentTableSQL);
        console.log('Equipment table ready.');
        
        db.exec(createUsersTableSQL);
        console.log('Users table ready.');
        
        // Create default admin user if no users exist
        createDefaultAdmin();
        
        // Force add new columns to equipment table (handles existing databases)
        forceAddNewColumns();
        
        // Insert initial data if equipment table is empty
        insertInitialData();
    } catch (error) {
        console.error('Error initializing database:', error);
    }
}

// Create default admin user
function createDefaultAdmin() {
    try {
        const countStmt = db.prepare("SELECT COUNT(*) as count FROM users");
        const result = countStmt.get();

        if (result.count === 0) {
            console.log('Creating default admin user...');
            const defaultPassword = 'admin123';
            const hashedPassword = bcrypt.hashSync(defaultPassword, 10);
            
            const insertAdminStmt = db.prepare(`
                INSERT INTO users (firstName, lastName, email, pantherId, password, role, authorizedLabs, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);

            insertAdminStmt.run(
                'System',
                'Administrator',
                'admin@fiu.edu',
                'ADMIN001',
                hashedPassword,
                'admin',
                'EC3625,EC3630,EC3760,EC3765,OU107,OU106',
                'active'
            );
            
            console.log('✅ Default admin user created:');
            console.log('   Email: admin@fiu.edu');
            console.log('   Password: admin123');
            console.log('   Please change this password after first login!');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
}

// Force add new columns (handles existing databases)
function forceAddNewColumns() {
    console.log('🔧 Ensuring Model and FIU ID columns exist...');
    
    try {
        // Check current schema first
        const tableInfoStmt = db.prepare("PRAGMA table_info(equipment)");
        const rows = tableInfoStmt.all();
        
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
        
        columnsToAdd.forEach(column => {
            try {
                const sql = `ALTER TABLE equipment ADD COLUMN ${column} TEXT`;
                db.exec(sql);
                console.log(`✅ Added ${column} column`);
            } catch (err) {
                if (!err.message.includes('duplicate column')) {
                    console.error(`❌ Error adding ${column} column:`, err.message);
                } else {
                    console.log(`✅ ${column} column already exists`);
                }
            }
        });
        
        if (columnsToAdd.length === 0) {
            console.log('✅ All required columns exist');
        }
    } catch (error) {
        console.error('Error checking schema:', error);
    }
}

// Insert initial data from data.js if table is empty
function insertInitialData() {
    try {
        const countStmt = db.prepare("SELECT COUNT(*) as count FROM equipment");
        const result = countStmt.get();

        if (result.count === 0) {
            console.log('Inserting initial equipment data...');
            
            // Import initial data from data.js
            const initialData = require('./data.js');
              const insertStmt = db.prepare(`
                INSERT INTO equipment (name, category, model, lab, buyingDate, serialNumber, fiuId, quantity, price, status, notes, image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            const insertMany = db.transaction((items) => {
                for (const item of items) {
                    insertStmt.run(
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
                    );
                }
            });

            insertMany(initialData);
            console.log('Initial data inserted successfully.');
        }
    } catch (error) {
        console.error('Error inserting initial data:', error);
    }
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

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Admin only middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
}

// Lab access middleware
function checkLabAccess(req, res, next) {
    const requestedLab = req.query.lab || req.body.lab;
    
    if (!requestedLab) {
        // If no specific lab is requested, user can see all their authorized labs
        return next();
    }

    const userAuthorizedLabs = req.user.authorizedLabs.split(',');
    
    if (req.user.role === 'admin' || req.user.role === 'grant' || userAuthorizedLabs.includes(requestedLab)) {
        return next();
    }

    return res.status(403).json({ message: 'Access denied to this lab' });
}

// Email sending function
async function sendEmail(to, subject, html) {
    try {
        const transporter = nodemailer.createTransporter(emailConfig);
        
        await transporter.sendMail({
            from: emailConfig.auth.user,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log('Email sent successfully to:', to);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}

// Authentication Routes

// Login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password required' });
    }

    db.get('SELECT * FROM users WHERE email = ? AND status = "active"', [email], async (err, user) => {
        if (err) {
            console.error('Database error during login:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or account not activated' });
        }

        try {
            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { 
                    id: user.id, 
                    email: user.email, 
                    role: user.role,
                    authorizedLabs: user.authorizedLabs
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    role: user.role,
                    authorizedLabs: user.authorizedLabs.split(',')
                }
            });
        } catch (error) {
            console.error('Error during login:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
});

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ 
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role,
            authorizedLabs: req.user.authorizedLabs.split(',')
        }
    });
});

// Setup password (for new users)
app.post('/api/auth/setup-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token and password required' });
    }

    db.get('SELECT * FROM users WHERE setupToken = ? AND setupTokenExpiry > datetime("now")', [token], async (err, user) => {
        if (err) {
            console.error('Database error during password setup:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired setup token' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            
            db.run(
                'UPDATE users SET password = ?, status = "active", setupToken = NULL, setupTokenExpiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [hashedPassword, user.id],
                function(err) {
                    if (err) {
                        console.error('Error updating user password:', err);
                        return res.status(500).json({ message: 'Database error' });
                    }

                    res.json({ message: 'Password set successfully' });
                }
            );
        } catch (error) {
            console.error('Error hashing password:', error);
            res.status(500).json({ message: 'Server error' });
        }
    });
});

// Get setup info (for password setup page)
app.get('/api/auth/setup-info', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Setup token required' });
    }

    db.get('SELECT firstName, lastName, email, role, authorizedLabs FROM users WHERE setupToken = ? AND setupTokenExpiry > datetime("now")', [token], (err, user) => {
        if (err) {
            console.error('Database error during setup info:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired setup token' });
        }

        res.json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            authorizedLabs: user.authorizedLabs.split(',')
        });
    });
});

// Admin Routes

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT id, firstName, lastName, email, pantherId, phoneNumber, role, authorizedLabs, status, created_at FROM users ORDER BY created_at DESC', (err, users) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        const formattedUsers = users.map(user => ({
            ...user,
            createdAt: user.created_at
        }));

        res.json(formattedUsers);
    });
});

// Add new user (admin only)
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    const { firstName, lastName, email, pantherId, phoneNumber, role, authorizedLabs } = req.body;

    if (!firstName || !lastName || !email || !pantherId || !role || !authorizedLabs || authorizedLabs.length === 0) {
        return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Generate setup token
    const setupToken = uuidv4();
    const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const authorizedLabsString = authorizedLabs.join(',');

    db.run(
        'INSERT INTO users (firstName, lastName, email, pantherId, phoneNumber, role, authorizedLabs, setupToken, setupTokenExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [firstName, lastName, email, pantherId, phoneNumber, role, authorizedLabsString, setupToken, setupTokenExpiry],
        async function(err) {
            if (err) {
                console.error('Error creating user:', err);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ message: 'Email or Panther ID already exists' });
                }
                return res.status(500).json({ message: 'Database error' });
            }

            // Send setup email
            const setupUrl = `${req.protocol}://${req.get('host')}/setup-password.html?token=${setupToken}`;
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #1e3c72;">Welcome to CEE Lab Equipment Manager</h2>
                    <p>Hello ${firstName} ${lastName},</p>
                    <p>You have been invited to join the CEE Lab Equipment Manager system as a <strong>${role}</strong>.</p>
                    <p><strong>Your Account Details:</strong></p>
                    <ul>
                        <li>Email: ${email}</li>
                        <li>Role: ${role}</li>
                        <li>Authorized Labs: ${authorizedLabs.join(', ')}</li>
                    </ul>
                    <p>To complete your registration, please click the link below to set your password:</p>
                    <p style="text-align: center; margin: 30px 0;">
                        <a href="${setupUrl}" style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">Set Your Password</a>
                    </p>
                    <p style="font-size: 12px; color: #666;">This link will expire in 24 hours. If you have any questions, please contact the system administrator.</p>
                </div>
            `;

            const emailSent = await sendEmail(email, 'Welcome to CEE Lab Equipment Manager - Set Your Password', emailHtml);
            
            if (!emailSent) {
                console.warn('Failed to send invitation email to:', email);
            }

            res.status(201).json({ 
                message: 'User created successfully', 
                emailSent: emailSent,
                setupUrl: setupUrl // For testing purposes
            });
        }
    );
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ message: 'Database error' });
        }

        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    });
});

// Serve login page for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// API Routes

// Get all equipment
app.get('/api/equipment', authenticateToken, (req, res) => {
    const { lab, status, search } = req.query;
    
    let sql = 'SELECT * FROM equipment WHERE 1=1';
    const params = [];
    
    // Filter by user's authorized labs if not admin/grant
    if (req.user.role !== 'admin' && req.user.role !== 'grant') {
        const authorizedLabs = req.user.authorizedLabs.split(',');
        const labPlaceholders = authorizedLabs.map(() => '?').join(',');
        sql += ` AND lab IN (${labPlaceholders})`;
        params.push(...authorizedLabs);
    }
    
    if (lab) {
        // Check if user has access to this specific lab
        if (req.user.role !== 'admin' && req.user.role !== 'grant') {
            const authorizedLabs = req.user.authorizedLabs.split(',');
            if (!authorizedLabs.includes(lab)) {
                return res.status(403).json({ error: 'Access denied to this lab' });
            }
        }
        sql += ' AND lab = ?';
        params.push(lab);
    }
    
    if (status) {
        sql += ' AND status = ?';
        params.push(status);
    }    if (search) {
        // For FIU ID search, also check without dashes
        const searchNoDashes = search.replace(/-/g, '');
        sql += ' AND (name LIKE ? OR category LIKE ? OR model LIKE ? OR serialNumber LIKE ? OR fiuId LIKE ? OR notes LIKE ? OR REPLACE(fiuId, \'-\', \'\') LIKE ?)';
        const searchTerm = `%${search}%`;
        const searchTermNoDashes = `%${searchNoDashes}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTermNoDashes);
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

// Get available images for restoration
app.get('/api/images', (req, res) => {
    try {
        const images = fs.readdirSync(uploadsDir)
            .filter(file => file.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i))
            .map(filename => {
                const filePath = path.join(uploadsDir, filename);
                const stats = fs.statSync(filePath);
                return {
                    filename,
                    size: stats.size,
                    modified: stats.mtime
                };
            })
            .sort((a, b) => b.modified - a.modified);
        
        res.json(images);
    } catch (error) {
        console.error('Error listing images:', error);
        res.status(500).json({ error: 'Error reading images directory' });
    }
});

// Get single equipment by ID
app.get('/api/equipment/:id', authenticateToken, (req, res) => {
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

        // Check if user has access to this equipment's lab
        if (req.user.role !== 'admin' && req.user.role !== 'grant') {
            const authorizedLabs = req.user.authorizedLabs.split(',');
            if (!authorizedLabs.includes(row.lab)) {
                return res.status(403).json({ error: 'Access denied to this equipment' });
            }
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
app.post('/api/equipment', authenticateToken, upload.single('image'), (req, res) => {
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

    // Check if user has access to add equipment to this lab
    if (req.user.role !== 'admin' && req.user.role !== 'grant') {
        const authorizedLabs = req.user.authorizedLabs.split(',');
        if (!authorizedLabs.includes(lab)) {
            return res.status(403).json({ error: 'Access denied to add equipment to this lab' });
        }
    }
    
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
app.put('/api/equipment/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { id } = req.params;
    console.log('Received PUT request for ID:', id);
    console.log('Request body:', req.body);

    // First check if the equipment exists and user has access
    db.get('SELECT lab FROM equipment WHERE id = ?', [id], (err, equipment) => {
        if (err) {
            console.error('Error checking equipment:', err.message);
            return res.status(500).json({ error: 'Database error' });
        }

        if (!equipment) {
            return res.status(404).json({ error: 'Equipment not found' });
        }

        // Check if user has access to this equipment's lab
        if (req.user.role !== 'admin' && req.user.role !== 'grant') {
            const authorizedLabs = req.user.authorizedLabs.split(',');
            if (!authorizedLabs.includes(equipment.lab)) {
                return res.status(403).json({ error: 'Access denied to modify this equipment' });
            }
        }

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

        // Validate required fields
        if (!name || !category || !lab || !serialNumber || !quantity || !status) {
            return res.status(400).json({ 
                error: 'Missing required fields. Required: name, category, lab, serialNumber, quantity, status' 
            });
        }

        // Validate quantity is a valid number
        const quantityNum = parseInt(quantity);
        if (isNaN(quantityNum) || quantityNum < 1) {
            return res.status(400).json({ error: 'Quantity must be a valid number greater than 0' });
        }

        // Validate price if provided
        let priceNum = null;
        if (price && price !== '') {
            priceNum = parseFloat(price);
            if (isNaN(priceNum) || priceNum < 0) {
                return res.status(400).json({ error: 'Price must be a valid number greater than or equal to 0' });
            }
        }

        // Check if user has access to move equipment to the new lab
        if (lab && lab !== equipment.lab) {
            if (req.user.role !== 'admin' && req.user.role !== 'grant') {
                const authorizedLabs = req.user.authorizedLabs.split(',');
                if (!authorizedLabs.includes(lab)) {
                    return res.status(403).json({ error: 'Access denied to move equipment to this lab' });
                }
            }
        }
    
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
                quantity = ?, price = ?, status = ?, notes = ?, image = ?, manualLink = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ?
            WHERE id = ?
        `;
        
        console.log('About to update with values:', [
            name, category, model || null, lab, buyingDate || null, serialNumber, fiuId || null, quantityNum, priceNum, status, notes || '', imagePath, manualLink || null, req.user.id, id
        ]);
        
        db.run(updateSQL, [
            name,
            category,
            model || null,
            lab,
            buyingDate || null,
            serialNumber,
            fiuId || null,
            quantityNum,
            priceNum,
            status,
            notes || '',
            imagePath,
            manualLink || null,
            req.user.id,
            id
        ], function(err) {
            if (err) {
                console.error('Error updating equipment:', err.message);
                return res.status(500).json({ error: 'Database error: ' + err.message });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Equipment not found' });
            }
            
            // Fetch the updated record with creator/updater names
            const fetchSQL = `
                SELECT e.*, 
                       creator.firstName || ' ' || creator.lastName as createdByName,
                       updater.firstName || ' ' || updater.lastName as updatedByName
                FROM equipment e
                LEFT JOIN users creator ON e.created_by = creator.id
                LEFT JOIN users updater ON e.updated_by = updater.id
                WHERE e.id = ?
            `;
            
            db.get(fetchSQL, [id], (err, row) => {
                if (err) {
                    console.error('Error fetching updated equipment:', err.message);
                    return res.status(500).json({ error: 'Database error fetching updated record: ' + err.message });
                }
                
                if (!row) {
                    return res.status(404).json({ error: 'Updated equipment not found' });
                }
                
                const equipmentWithAge = {
                    ...row,
                    age: calculateAge(row.buyingDate)
                };
                
                console.log('Successfully updated equipment:', equipmentWithAge);
                res.json(equipmentWithAge);
            });
        });
    });
});

// Update equipment image only (for restoration tool)
app.put('/api/equipment/:id/image', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { image } = req.body;
    
    console.log('Updating image for equipment ID:', id, 'Image:', image);
    
    const updateSQL = 'UPDATE equipment SET image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    
    db.run(updateSQL, [image, id], function(err) {
        if (err) {
            console.error('Error updating equipment image:', err.message);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (this.changes === 0) {
            res.status(404).json({ error: 'Equipment not found' });
            return;
        }
        
        res.json({ success: true, message: 'Image updated successfully' });
    });
});

// Delete equipment
app.delete('/api/equipment/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    
    // First get the equipment to check access and delete associated image
    db.get('SELECT image, lab FROM equipment WHERE id = ?', [id], (err, row) => {
        if (err) {
            console.error('Error fetching equipment for deletion:', err.message);
            res.status(500).json({ error: 'Database error' });
            return;
        }
        
        if (!row) {
            res.status(404).json({ error: 'Equipment not found' });
            return;
        }

        // Check if user has access to delete this equipment
        if (req.user.role !== 'admin' && req.user.role !== 'grant') {
            const authorizedLabs = req.user.authorizedLabs.split(',');
            if (!authorizedLabs.includes(row.lab)) {
                return res.status(403).json({ error: 'Access denied to delete this equipment' });
            }
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
