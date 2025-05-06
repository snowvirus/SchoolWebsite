require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function setupStudentUsers() {
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

        // Create users table if it doesn't exist
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100) NOT NULL,
                full_name VARCHAR(100) NOT NULL,
                user_type VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Get all students from the students table
        const [students] = await connection.execute(
            'SELECT admissionNumber, firstName, lastName, parentEmail FROM students'
        );

        console.log(`Found ${students.length} students in the database`);

        for (const student of students) {
            // Hash the password (using admission number as initial password)
            const hashedPassword = await bcrypt.hash(student.admissionNumber, 10);

            // Insert or update the user
            await connection.execute(`
                INSERT INTO users (username, password, email, full_name, user_type)
                VALUES (?, ?, ?, ?, 'student')
                ON DUPLICATE KEY UPDATE
                password = VALUES(password),
                email = VALUES(email),
                full_name = VALUES(full_name),
                user_type = VALUES(user_type)
            `, [
                student.admissionNumber,
                hashedPassword,
                student.parentEmail || `${student.admissionNumber}@school.com`,
                `${student.firstName} ${student.lastName}`
            ]);

            console.log(`Student user created/updated: ${student.admissionNumber}`);
        }

        console.log('Student users setup completed');
        await connection.end();
        console.log('Database connection closed');
    } catch (error) {
        console.error('Error setting up student users:', error);
    }
}

setupStudentUsers(); 