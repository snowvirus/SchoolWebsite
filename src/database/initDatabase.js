const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

<<<<<<< HEAD
=======
async function createDatabase() {
    // Create a connection without specifying the database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });

    // Create the database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'school_management'}`);
    await connection.end();
}

// Create a pool with the database specified
>>>>>>> 403b044 (Updated files, removed unused HTML/CSS/JS, added src and logs directories)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function initializeDatabase() {
    try {
<<<<<<< HEAD
        // Read and execute SQL setup script
        const sqlPath = path.join(__dirname, 'database_setup.sql');
=======
        // Create database if it doesn't exist
        await createDatabase();

        // Read and execute SQL setup script
        const sqlPath = path.join(__dirname, 'setup_database.sql');
>>>>>>> 403b044 (Updated files, removed unused HTML/CSS/JS, added src and logs directories)
        const sqlScript = await fs.readFile(sqlPath, 'utf8');

        // Split script into individual statements
        const statements = sqlScript
            .split(';')
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0 && !statement.startsWith('--'));

        // Get a connection from the pool
        const connection = await pool.getConnection();

        try {
            // Execute each statement
            for (const statement of statements) {
                try {
                    if (statement.toLowerCase().startsWith('use ')) {
                        // Skip USE statements as we're already connected to the database
                        continue;
                    }
                    await connection.execute(statement);
<<<<<<< HEAD
                } catch (error) {
                    // Ignore errors for existing tables and duplicate entries
                    if (error.code !== 'ER_TABLE_EXISTS_ERROR' && 
                        error.code !== 'ER_DUP_ENTRY' &&
                        !error.message.includes('already exists')) {
                        console.error('Error executing statement:', error);
                        console.error('Statement:', statement);
=======
                    console.log('Executed SQL statement successfully');
                } catch (error) {
                    // Log all errors for debugging
                    console.error('Error executing statement:', error);
                    console.error('Statement:', statement);
                    
                    // Only throw if it's not a duplicate table error
                    if (error.code !== 'ER_TABLE_EXISTS_ERROR' && 
                        error.code !== 'ER_DUP_ENTRY' &&
                        !error.message.includes('already exists')) {
                        throw error;
>>>>>>> 403b044 (Updated files, removed unused HTML/CSS/JS, added src and logs directories)
                    }
                }
            }
        } finally {
            connection.release();
        }

        console.log('Database initialized successfully');
        return pool;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
}

module.exports = {
    pool,
    initializeDatabase
}; 