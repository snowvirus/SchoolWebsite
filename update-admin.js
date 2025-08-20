require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function updateAdmin() {
  const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  };

  // Use env var for admin password, fallback only for local dev
  const plainPassword = process.env.ADMIN_PASSWORD || 'admin123';

  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    // Hash password
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Use parameterized query
    const [result] = await connection.execute(
      `UPDATE admin_users 
       SET password_hash = ? 
       WHERE username = ?`,
      [passwordHash, 'admin']
    );

    if (result.affectedRows === 0) {
      console.warn('⚠️ No admin user found to update');
    } else {
      console.log('✅ Admin password updated successfully');
      console.log(`👉 Username: admin`);
      console.log(`👉 Password: ${plainPassword}`);
    }
  } catch (error) {
    console.error('❌ Error updating admin:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

updateAdmin();
