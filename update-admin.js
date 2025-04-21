require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateAdmin() {
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

        // Hash new password
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Update admin user password
        await connection.execute(`
            UPDATE admin_users 
            SET password_hash = ?
            WHERE username = 'admin'
        `, [passwordHash]);

        console.log('Admin password updated');
        console.log('Username: admin');
        console.log('Password: admin123');

        await connection.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error updating admin:', error);
    }
}

updateAdmin(); 