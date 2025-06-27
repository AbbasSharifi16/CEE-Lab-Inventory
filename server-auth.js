// Load environment variables
require('dotenv').config();

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

// Email configuration using environment variables
const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER || 'your-email@gmail.com',
        pass: process.env.SMTP_PASS || 'your-app-password'
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
    const createEquipmentTableSQL = `
        CREATE TABLE IF NOT EXISTS equipment (
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
            created_by INTEGER REFERENCES users(id),
            updated_by INTEGER REFERENCES users(id),
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
        
        // Add user tracking columns if they don't exist (migration)
        try {
            db.exec('ALTER TABLE equipment ADD COLUMN created_by INTEGER REFERENCES users(id)');
            console.log('Added created_by column to equipment table.');
        } catch (e) {
            // Column already exists, ignore
        }
        
        try {
            db.exec('ALTER TABLE equipment ADD COLUMN updated_by INTEGER REFERENCES users(id)');
            console.log('Added updated_by column to equipment table.');
        } catch (e) {
            // Column already exists, ignore
        }
        
        // Create default admin user if no users exist
        createDefaultAdmin();
        
        console.log('✅ Database initialization completed');
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

// Helper function to calculate age
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

// Email sending function
async function sendEmail(to, subject, html) {
    try {
        const transporter = nodemailer.createTransport(emailConfig);
        
        // Verify connection configuration if in development
        if (process.env.NODE_ENV !== 'production') {
            await transporter.verify();
            console.log('✅ SMTP connection verified');
        }
        
        await transporter.sendMail({
            from: `"${process.env.EMAIL_SYSTEM_NAME || 'CEE Lab Equipment Manager'}" <${process.env.FROM_EMAIL || emailConfig.auth.user}>`,
            to: to,
            subject: subject,
            html: html
        });
        
        console.log('✅ Email sent successfully to:', to);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
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

    try {
        const userStmt = db.prepare('SELECT * FROM users WHERE email = ? AND status = ?');
        const user = userStmt.get(email, 'active');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or account not activated' });
        }

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

// Verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
    try {
        // Get full user details from database
        const userStmt = db.prepare('SELECT id, firstName, lastName, email, role, authorizedLabs FROM users WHERE id = ?');
        const userDetails = userStmt.get(req.user.id);
        
        if (!userDetails) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ 
            user: {
                id: userDetails.id,
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                email: userDetails.email,
                role: userDetails.role,
                authorizedLabs: userDetails.authorizedLabs.split(',')
            }
        });
    } catch (error) {
        console.error('Error in verify endpoint:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Setup password (for new users)
app.post('/api/auth/setup-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token and password required' });
    }

    try {
        const userStmt = db.prepare('SELECT * FROM users WHERE setupToken = ? AND setupTokenExpiry > datetime(\'now\')');
        const user = userStmt.get(token);

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired setup token' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const updateStmt = db.prepare(
            'UPDATE users SET password = ?, status = ?, setupToken = NULL, setupTokenExpiry = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
        );
        
        updateStmt.run(hashedPassword, 'active', user.id);

        res.json({ message: 'Password set successfully' });
    } catch (error) {
        console.error('Error setting password:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get setup info (for password setup page)
app.get('/api/auth/setup-info', (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(400).json({ message: 'Setup token required' });
    }

    try {
        const userStmt = db.prepare('SELECT firstName, lastName, email, role, authorizedLabs FROM users WHERE setupToken = ? AND setupTokenExpiry > datetime(\'now\')');
        const user = userStmt.get(token);

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
    } catch (error) {
        console.error('Error getting setup info:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Admin Routes

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, (req, res) => {
    try {
        const usersStmt = db.prepare('SELECT id, firstName, lastName, email, pantherId, phoneNumber, role, authorizedLabs, status, created_at FROM users ORDER BY created_at DESC');
        const users = usersStmt.all();

        const formattedUsers = users.map(user => ({
            ...user,
            createdAt: user.created_at
        }));

        res.json(formattedUsers);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Add new user (admin only)
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    const { firstName, lastName, email, pantherId, phoneNumber, role, authorizedLabs } = req.body;

    if (!firstName || !lastName || !email || !pantherId || !role || !authorizedLabs || authorizedLabs.length === 0) {
        return res.status(400).json({ message: 'All required fields must be provided' });
    }

    try {
        // Generate setup token
        const setupToken = uuidv4();
        const setupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const authorizedLabsString = authorizedLabs.join(',');

        const insertStmt = db.prepare(
            'INSERT INTO users (firstName, lastName, email, pantherId, phoneNumber, role, authorizedLabs, setupToken, setupTokenExpiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );

        const result = insertStmt.run(firstName, lastName, email, pantherId, phoneNumber, role, authorizedLabsString, setupToken, setupTokenExpiry.toISOString());

        // Send setup email
        const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
        const setupUrl = `${baseUrl}/setup-password.html?token=${setupToken}`;
        const systemName = process.env.EMAIL_SYSTEM_NAME || 'CEE Lab Equipment Manager';
        const companyName = process.env.EMAIL_COMPANY_NAME || 'Florida International University';
        
        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1e3c72;">Welcome to ${systemName}</h2>
                <p>Hello ${firstName} ${lastName},</p>
                <p>You have been invited to join the ${systemName} at ${companyName} as a <strong>${role}</strong>.</p>
                <p><strong>Your Account Details:</strong></p>
                <ul>
                    <li>Email: ${email}</li>
                    <li>Role: ${role}</li>
                    <li>Authorized Labs: ${authorizedLabs.join(', ')}</li>
                </ul>
                <p>To complete your registration, please click the button below to set your password:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${setupUrl}" style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); color: black; padding: 15px 40px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; box-shadow: 0 4px 8px rgba(30, 60, 114, 0.3); transition: all 0.3s ease;">
                        🔐 Set Your Password
                    </a>
                </div>
                <p style="text-align: center; font-size: 12px; color: #666; margin-top: 15px;">
                    Or copy and paste this link into your browser:<br>
                    <span style="word-break: break-all; font-family: monospace; background: #f5f5f5; padding: 5px; border-radius: 4px;">${setupUrl}</span>
                </p>
                <p style="font-size: 12px; color: #666;">This link will expire in 24 hours. If you have any questions, please contact the system administrator.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="font-size: 12px; color: #999; text-align: center;">${companyName} - ${systemName}</p>
            </div>
        `;

        const emailSent = await sendEmail(email, `Welcome to ${systemName} - Set Your Password`, emailHtml);
        
        if (!emailSent) {
            console.warn('Failed to send invitation email to:', email);
        }

        res.status(201).json({ 
            message: 'User created successfully', 
            emailSent: emailSent,
            setupUrl: setupUrl // For testing purposes
        });
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email or Panther ID already exists' });
        }
        res.status(500).json({ message: 'Database error' });
    }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    try {
        const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
        const result = deleteStmt.run(id);

        if (result.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Update user (admin only)
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { firstName, lastName, email, pantherId, phoneNumber, role, authorizedLabs, status } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !pantherId || !role || !authorizedLabs) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate role
    if (!['admin', 'grant', 'faculty'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
    }

    // Validate status
    if (status && !['active', 'pending', 'inactive'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        // Check if user exists
        const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const existingUser = userStmt.get(id);
        
        if (!existingUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if email is already taken by another user
        const emailCheckStmt = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?');
        const emailExists = emailCheckStmt.get(email, id);
        
        if (emailExists) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        // Check if pantherId is already taken by another user
        const pantherIdCheckStmt = db.prepare('SELECT id FROM users WHERE pantherId = ? AND id != ?');
        const pantherIdExists = pantherIdCheckStmt.get(pantherId, id);
        
        if (pantherIdExists) {
            return res.status(400).json({ message: 'Panther ID already exists' });
        }

        // Prevent admin from changing their own role or status
        if (parseInt(id) === req.user.id) {
            if (role !== existingUser.role) {
                return res.status(400).json({ message: 'Cannot change your own role' });
            }
            if (status && status !== existingUser.status) {
                return res.status(400).json({ message: 'Cannot change your own status' });
            }
        }

        // Convert authorized labs array to string
        const labsString = Array.isArray(authorizedLabs) ? authorizedLabs.join(',') : authorizedLabs;

        // Update user
        const updateStmt = db.prepare(`
            UPDATE users 
            SET firstName = ?, lastName = ?, email = ?, pantherId = ?, phoneNumber = ?, 
                role = ?, authorizedLabs = ?, status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);

        const result = updateStmt.run(
            firstName, 
            lastName, 
            email, 
            pantherId, 
            phoneNumber || null,
            role, 
            labsString, 
            status || existingUser.status,
            id
        );

        if (result.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Get single user (admin only)
app.get('/api/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    try {
        const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
        const user = userStmt.get(id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Don't return password
        delete user.password;
        delete user.setupToken;
        delete user.setupTokenExpiry;

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ message: 'Database error' });
    }
});

// Equipment API Routes (Basic versions - need to add full CRUD)

// Get all equipment
app.get('/api/equipment', authenticateToken, (req, res) => {
    const { lab, status, search } = req.query;
    
    try {
        let sql = `
            SELECT e.*, 
                   creator.firstName || ' ' || creator.lastName as createdByName,
                   updater.firstName || ' ' || updater.lastName as updatedByName
            FROM equipment e
            LEFT JOIN users creator ON e.created_by = creator.id
            LEFT JOIN users updater ON e.updated_by = updater.id
            WHERE 1=1`;
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
        }
        
        if (search) {
            const searchNoDashes = search.replace(/-/g, '');
            sql += ' AND (name LIKE ? OR category LIKE ? OR model LIKE ? OR serialNumber LIKE ? OR fiuId LIKE ? OR notes LIKE ? OR REPLACE(fiuId, \'-\', \'\') LIKE ?)';
            const searchTerm = `%${search}%`;
            const searchTermNoDashes = `%${searchNoDashes}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTermNoDashes);
        }
        
        sql += ' ORDER BY created_at DESC';
        
        const stmt = db.prepare(sql);
        const rows = stmt.all(...params);
        
        // Add calculated age to each item
        const equipmentWithAge = rows.map(item => ({
            ...item,
            age: calculateAge(item.buyingDate)
        }));
        
        res.json(equipmentWithAge);
    } catch (error) {
        console.error('Error fetching equipment:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Get single equipment item
app.get('/api/equipment/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    console.log('Fetching equipment with ID:', id);
    
    try {
        const sql = `
            SELECT e.*, 
                   creator.firstName || ' ' || creator.lastName as createdByName,
                   updater.firstName || ' ' || updater.lastName as updatedByName
            FROM equipment e
            LEFT JOIN users creator ON e.created_by = creator.id
            LEFT JOIN users updater ON e.updated_by = updater.id
            WHERE e.id = ?
        `;
        
        const stmt = db.prepare(sql);
        const row = stmt.get(id);
        
        if (!row) {
            return res.status(404).json({ error: 'Equipment not found' });
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
    } catch (error) {
        console.error('Error fetching equipment:', error.message);
        return res.status(500).json({ error: 'Database error: ' + error.message });
    }
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
    
    try {
        const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
        
        const insertSQL = `
            INSERT INTO equipment (name, category, model, lab, buyingDate, serialNumber, fiuId, quantity, price, status, notes, image, manualLink, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        console.log('About to insert with values:', [
            name, category, model || null, lab, buyingDate || null, serialNumber, fiuId || null, parseInt(quantity), price ? parseFloat(price) : null, status, notes || '', imagePath, manualLink || null, req.user.id
        ]);
        
        const insertStmt = db.prepare(insertSQL);
        const result = insertStmt.run(
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
            req.user.id
        );
        
        console.log('Equipment inserted with ID:', result.lastInsertRowid);
        
        // Fetch the newly created equipment with user names
        const fetchSQL = `
            SELECT e.*, 
                   creator.firstName || ' ' || creator.lastName as createdByName,
                   updater.firstName || ' ' || updater.lastName as updatedByName
            FROM equipment e
            LEFT JOIN users creator ON e.created_by = creator.id
            LEFT JOIN users updater ON e.updated_by = updater.id
            WHERE e.id = ?
        `;
        
        const fetchStmt = db.prepare(fetchSQL);
        const row = fetchStmt.get(result.lastInsertRowid);
        
        if (!row) {
            return res.status(500).json({ error: 'Equipment created but error fetching details' });
        }
        
        const equipmentWithAge = {
            ...row,
            age: calculateAge(row.buyingDate)
        };
        
        res.status(201).json(equipmentWithAge);
    } catch (error) {
        console.error('Error inserting equipment:', error.message);
        return res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// Update equipment
app.put('/api/equipment/:id', authenticateToken, upload.single('image'), (req, res) => {
    const { id } = req.params;
    console.log('Received PUT request for ID:', id);
    console.log('Request body:', req.body);

    try {
        // First check if the equipment exists and user has access
        const equipment = db.prepare('SELECT lab FROM equipment WHERE id = ?').get(id);
        
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
        
        const updateStmt = db.prepare(updateSQL);
        const result = updateStmt.run(
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
        );
        
        if (result.changes === 0) {
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
        
        const fetchStmt = db.prepare(fetchSQL);
        const row = fetchStmt.get(id);
        
        if (!row) {
            return res.status(404).json({ error: 'Updated equipment not found' });
        }
        
        const equipmentWithAge = {
            ...row,
            age: calculateAge(row.buyingDate)
        };
        
        console.log('Successfully updated equipment:', equipmentWithAge);
        res.json(equipmentWithAge);
        
    } catch (error) {
        console.error('Error updating equipment:', error.message);
        return res.status(500).json({ error: 'Database error: ' + error.message });
    }
});

// Equipment Backup API (admin only)
app.post('/api/admin/backup', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('🔄 Starting equipment backup from admin panel...');
        
        // Get all equipment data for backup
        const sql = `
            SELECT 
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
                image,
                manualLink,
                created_at,
                updated_at
            FROM equipment 
            ORDER BY lab, name
        `;
        
        const stmt = db.prepare(sql);
        const rows = stmt.all();
        
        console.log(`📊 Found ${rows.length} equipment records to backup`);

        // Transform the data to match import format
        const backupData = rows.map(row => {
            const equipment = {
                name: row.name,
                category: row.category,
                lab: row.lab,
                serialNumber: row.serialNumber,
                quantity: row.quantity,
                status: row.status || 'Not specified'
            };

            // Add optional fields only if they have values
            if (row.model) equipment.model = row.model;
            if (row.fiuId) equipment.fiuId = row.fiuId;
            if (row.buyingDate) equipment.buyingDate = row.buyingDate;
            if (row.price !== null && row.price !== undefined) equipment.price = row.price;
            if (row.notes) equipment.notes = row.notes;
            if (row.image) equipment.image = row.image;
            if (row.manualLink) equipment.manualLink = row.manualLink;

            // Add metadata for reference
            if (row.created_at) equipment.created_at = row.created_at;
            if (row.updated_at) equipment.updated_at = row.updated_at;

            return equipment;
        });

        // Create backup metadata
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupMetadata = {
            backupDate: new Date().toISOString(),
            totalRecords: rows.length,
            labs: [...new Set(rows.map(r => r.lab))].sort(),
            statusCounts: {},
            imageCount: rows.filter(r => r.image).length,
            description: 'Equipment database backup from admin panel - can be used with import-equipment.js to restore data'
        };

        // Count equipment by status
        rows.forEach(row => {
            const status = row.status || 'Not specified';
            backupMetadata.statusCounts[status] = (backupMetadata.statusCounts[status] || 0) + 1;
        });

        // Create the backup data objects
        const backupObject = {
            metadata: backupMetadata,
            equipment: backupData
        };

        // For admin panel, we'll return the JSON data directly for download
        const filename = `equipment_backup_${timestamp}.json`;
        
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        res.json(backupObject);

        console.log(`✅ Backup sent to admin panel: ${filename}`);
        console.log(`📊 Total records: ${rows.length}`);

    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// Get backup data (admin only) - for downloading
app.get('/api/admin/backup', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get all equipment data
        const sql = `
            SELECT 
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
                image,
                manualLink,
                created_at,
                updated_at
            FROM equipment 
            ORDER BY lab, name
        `;
        
        const stmt = db.prepare(sql);
        const rows = stmt.all();

        // Transform the data
        const backupData = rows.map(row => {
            const equipment = {
                name: row.name,
                category: row.category,
                lab: row.lab,
                serialNumber: row.serialNumber,
                quantity: row.quantity,
                status: row.status || 'Not specified'
            };

            if (row.model) equipment.model = row.model;
            if (row.fiuId) equipment.fiuId = row.fiuId;
            if (row.buyingDate) equipment.buyingDate = row.buyingDate;
            if (row.price !== null && row.price !== undefined) equipment.price = row.price;
            if (row.notes) equipment.notes = row.notes;
            if (row.image) equipment.image = row.image;
            if (row.manualLink) equipment.manualLink = row.manualLink;
            if (row.created_at) equipment.created_at = row.created_at;
            if (row.updated_at) equipment.updated_at = row.updated_at;

            return equipment;
        });

        // Create metadata
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupMetadata = {
            backupDate: new Date().toISOString(),
            totalRecords: rows.length,
            labs: [...new Set(rows.map(r => r.lab))].sort(),
            statusCounts: {},
            imageCount: rows.filter(r => r.image).length,
            description: 'Equipment database backup from admin panel'
        };

        rows.forEach(row => {
            const status = row.status || 'Not specified';
            backupMetadata.statusCounts[status] = (backupMetadata.statusCounts[status] || 0) + 1;
        });

        const backupObject = {
            metadata: backupMetadata,
            equipment: backupData
        };

        const filename = `equipment_backup_${timestamp}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(backupObject, null, 2));

    } catch (error) {
        console.error('Error creating backup:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// Restore equipment from backup (admin only)
app.post('/api/admin/restore', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { data, clearFirst } = req.body;
        let equipmentData = data;

        // If data has metadata and equipment properties (backup format), extract equipment
        if (data.metadata && data.equipment) {
            equipmentData = data.equipment;
        }

        if (!Array.isArray(equipmentData)) {
            return res.status(400).json({ error: 'Invalid data format. Expected array of equipment items.' });
        }

        const userId = req.user.id;
        let importedCount = 0;
        let errors = [];

        // Validation for required fields
        const requiredFields = ['name', 'category', 'lab', 'serialNumber', 'quantity', 'status'];
        
        for (const item of equipmentData) {
            for (const field of requiredFields) {
                if (!item[field] && item[field] !== 0) {
                    errors.push(`Item missing required field "${field}": ${JSON.stringify(item)}`);
                    break;
                }
            }
        }

        if (errors.length > 0) {
            return res.status(400).json({ 
                error: 'Validation errors found',
                details: errors.slice(0, 5) // Show first 5 errors
            });
        }

        // Clear existing data if requested
        if (clearFirst) {
            console.log('🗑️ Clearing existing equipment data...');
            const deleteStmt = db.prepare('DELETE FROM equipment');
            deleteStmt.run();
            console.log('✅ Existing equipment data cleared');
        }

        // Prepare the insert statement
        const insertStmt = db.prepare(`
            INSERT INTO equipment (
                name, category, model, lab, buyingDate, 
                serialNumber, fiuId, quantity, price, 
                status, notes, image, manualLink, created_by, updated_by,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        // Track used serial numbers to handle duplicates
        const usedSerials = new Set();
        
        // Get existing serial numbers if not clearing
        if (!clearFirst) {
            const existingStmt = db.prepare('SELECT serialNumber FROM equipment');
            const existing = existingStmt.all();
            existing.forEach(row => usedSerials.add(row.serialNumber));
        }

        for (const item of equipmentData) {
            try {
                // Handle duplicate serial numbers
                let serialNumber = item.serialNumber;
                let counter = 1;
                while (usedSerials.has(serialNumber)) {
                    serialNumber = `${item.serialNumber}-DUP${counter}`;
                    counter++;
                }
                usedSerials.add(serialNumber);

                const now = new Date().toISOString();
                
                insertStmt.run(
                    item.name,
                    item.category,
                    item.model || '',
                    item.lab,
                    item.buyingDate || '',
                    serialNumber,
                    item.fiuId || '',
                    item.quantity,
                    item.price || null,
                    item.status,
                    item.notes || '',
                    item.image || null,
                    item.manualLink || '',
                    userId,
                    userId,
                    item.created_at || now,
                    now
                );

                importedCount++;
                
                if (serialNumber !== item.serialNumber) {
                    console.log(`⚠️ Renamed duplicate serial: ${item.serialNumber} → ${serialNumber}`);
                }

            } catch (error) {
                console.error(`Error importing item: ${JSON.stringify(item)}`, error);
                errors.push(`Failed to import: ${item.name} - ${error.message}`);
            }
        }

        console.log(`✅ Restore completed: ${importedCount} items imported`);
        
        res.json({
            success: true,
            imported: importedCount,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined
        });

    } catch (error) {
        console.error('Error restoring backup:', error);
        res.status(500).json({ error: 'Failed to restore backup: ' + error.message });
    }
});

// Clear all equipment data (admin only)
app.post('/api/admin/clear', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Get count before deletion
        const countStmt = db.prepare('SELECT COUNT(*) as count FROM equipment');
        const { count } = countStmt.get();

        // Delete all equipment
        const deleteStmt = db.prepare('DELETE FROM equipment');
        const result = deleteStmt.run();

        console.log(`🗑️ Database cleared: ${count} equipment items removed`);
        
        res.json({
            success: true,
            deletedCount: count,
            message: `Successfully cleared ${count} equipment items`
        });

    } catch (error) {
        console.error('Error clearing database:', error);
        res.status(500).json({ error: 'Failed to clear database: ' + error.message });
    }
});

// Serve login page for root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

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
    db.close();
    console.log('Database connection closed.');
    process.exit(0);
});
