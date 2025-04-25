const mysql = require('mysql2/promise');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

async function initializeDatabase() {
    try {
        // Test connection
        const connection = await pool.getConnection();
        logger.info('Successfully connected to the database');
        connection.release();

        // Create database if it doesn't exist
        await pool.query('CREATE DATABASE IF NOT EXISTS school_management');
        logger.info('Database created or already exists');

        // Switch to the database
        await pool.query('USE school_management');
        logger.info('Using school_management database');

        // Read and execute setup scripts
        const setupScript = await fs.readFile(path.join(__dirname, '../../database_setup.sql'), 'utf8');
        await executeScript(setupScript);
        logger.info('Main database setup completed');

        const additionalTablesScript = await fs.readFile(path.join(__dirname, '../../additional_tables.sql'), 'utf8');
        await executeScript(additionalTablesScript);
        logger.info('Additional tables setup completed');

        // Create admin user if not exists
        await createAdminUser();
        logger.info('Admin user created/verified');

    } catch (error) {
        logger.error('Error initializing database:', error);
        throw error;
    }
}

async function executeScript(script) {
    const statements = script
        .split(';')
        .map(statement => statement.trim())
        .filter(statement => statement.length > 0);

    for (const statement of statements) {
        try {
            await pool.query(statement);
        } catch (error) {
            if (!error.message.includes('already exists')) {
                logger.error('Error executing statement:', statement);
                throw error;
            }
        }
    }
}

async function createAdminUser() {
    const bcrypt = require('bcryptjs');
    const password = 'admin123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await pool.execute(`
        INSERT IGNORE INTO admin_users (username, password, full_name, email, role)
        VALUES (?, ?, 'Administrator', 'admin@school.com', 'admin')
    `, ['admin', passwordHash]);

    logger.info('Admin credentials:');
    logger.info('Username: admin');
    logger.info('Password: admin123');
}

module.exports = {
    pool,
    initializeDatabase
}; 