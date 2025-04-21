require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        // Create circulars table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS circulars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                file_path VARCHAR(255) NOT NULL,
                uploaded_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploaded_by) REFERENCES admin_users(id)
            )
        `);
        console.log('Circulars table created/verified successfully');

        // Create calendar_events table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS calendar_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES admin_users(id)
            )
        `);
        console.log('Calendar events table created/verified successfully');

    } catch (error) {
        console.error('Error setting up tables:', error);
    } finally {
        await connection.end();
        console.log('Database connection closed');
    }
}

setupTables(); 