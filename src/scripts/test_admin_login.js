const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function testAdminLogin() {
    try {
        // Create database connection
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'Security@12',
            database: 'school_management'
        });

        // Test credentials
        const username = 'admin';
        const password = 'admin123';
        const role = 'admin';

        // Get admin user
        const [users] = await connection.execute(
            'SELECT * FROM users WHERE username = ? AND user_type = ?',
            [username, role]
        );

        if (users.length === 0) {
            console.log('Admin user not found');
            return;
        }

        const user = users[0];
        console.log('Found admin user:', {
            id: user.id,
            username: user.username,
            user_type: user.user_type
        });

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password verification:', validPassword ? 'Success' : 'Failed');

        await connection.end();
    } catch (error) {
        console.error('Error testing admin login:', error);
    }
}

testAdminLogin(); 