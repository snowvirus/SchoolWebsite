require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupStudentsTable() {
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

        // Create students table if it doesn't exist
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS students (
                id INT AUTO_INCREMENT PRIMARY KEY,
                admission_number VARCHAR(20) UNIQUE NOT NULL,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                date_of_birth DATE NOT NULL,
                gender ENUM('male', 'female') NOT NULL,
                class VARCHAR(20) NOT NULL,
                stream VARCHAR(20) NOT NULL,
                parent_name VARCHAR(100) NOT NULL,
                parent_phone VARCHAR(20) NOT NULL,
                parent_email VARCHAR(100),
                address TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        console.log('Students table created/verified');
        await connection.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error setting up students table:', error);
    }
}

setupStudentsTable(); 