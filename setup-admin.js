require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupAdmin() {
    const dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    try {
        // Create connection
        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected to database');

        // Create admin_users table if it doesn't exist
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) DEFAULT 'admin',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Admin users table created/verified');

        // Hash password
        const password = 'admin123'; // Default password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert admin user if not exists
        await connection.execute(`
            INSERT IGNORE INTO admin_users (username, password_hash, role)
            VALUES (?, ?, 'admin')
        `, ['admin', passwordHash]);

        console.log('Admin user created/verified');
        console.log('Username: admin');
        console.log('Password: admin123');

        await connection.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error setting up admin:', error);
    }
}

setupAdmin(); 