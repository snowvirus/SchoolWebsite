const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function updateAdminPassword() {
    try {
        // Create database connection
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Security@12',
            database: 'school_management'
        });

        // Generate password hash
        const password = 'admin123';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Update admin password
        await connection.execute(
            'UPDATE users SET password = ? WHERE username = ? AND user_type = ?',
            [hash, 'admin', 'admin']
        );

        console.log('Admin password updated successfully');
        await connection.end();
    } catch (error) {
        console.error('Error updating admin password:', error);
    }
}

updateAdminPassword(); 