require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management'
};

async function setupAdmin() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

<<<<<<< HEAD
        // Hash password
        const password = 'admin123'; // Default password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert admin user if not exists
        await connection.execute(`
            INSERT IGNORE INTO admin_users (username, password, full_name, email, role)
            VALUES (?, ?, 'Administrator', 'admin@school.com', 'admin')
        `, ['admin', passwordHash]);

        console.log('Admin user created/verified');
=======
        // Check if admin_users table exists and its structure
        const [tables] = await connection.execute('SHOW TABLES LIKE "admin_users"');
        if (tables.length === 0) {
            // Create admin_users table if it doesn't exist
            await connection.execute(`
                CREATE TABLE admin_users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    email VARCHAR(100) UNIQUE NOT NULL,
                    role VARCHAR(20) DEFAULT 'admin',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } else {
            // Check if role column exists
            const [columns] = await connection.execute('SHOW COLUMNS FROM admin_users LIKE "role"');
            if (columns.length === 0) {
                // Add role column if it doesn't exist
                await connection.execute('ALTER TABLE admin_users ADD COLUMN role VARCHAR(20) DEFAULT "admin"');
            }
        }

        // Hash the admin password
        const password = 'admin123'; // You can change this to your preferred password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert admin user
        await connection.execute(`
            INSERT INTO admin_users (username, password, email, role)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            password = VALUES(password),
            email = VALUES(email)
        `, ['admin', hashedPassword, 'admin@school.com', 'admin']);

        console.log('Admin user created successfully');
>>>>>>> 403b044 (Updated files, removed unused HTML/CSS/JS, added src and logs directories)
        console.log('Username: admin');
        console.log('Password:', password);
        console.log('Please change this password after first login');

        await connection.end();
    } catch (error) {
        console.error('Error setting up admin:', error);
        process.exit(1);
    }
}

setupAdmin(); 