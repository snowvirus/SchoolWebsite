require('dotenv').config();
const mysql = require('mysql2/promise');

async function setupTables() {
    const dbConfig = {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    };

    let connection;

    try {
        // Connect to DB
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database');

        // Helper to create a table
        const createTable = async (query, name) => {
            try {
                await connection.execute(query);
                console.log(`✅ Table "${name}" created/verified`);
            } catch (err) {
                console.error(`❌ Failed creating "${name}" table:`, err.message);
            }
        };

        // Circulars table
        await createTable(`
            CREATE TABLE IF NOT EXISTS circulars (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                file_path VARCHAR(255) NOT NULL,
                uploaded_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploaded_by) REFERENCES admin_users(id) ON DELETE CASCADE,
                INDEX idx_uploaded_by (uploaded_by)
            )
        `, "circulars");

        // Calendar events table
        await createTable(`
            CREATE TABLE IF NOT EXISTS calendar_events (
                id INT AUTO_INCREMENT PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                date DATE NOT NULL,
                created_by INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES admin_users(id) ON DELETE CASCADE,
                INDEX idx_created_by (created_by),
                INDEX idx_event_date (date)
            )
        `, "calendar_events");

    } catch (error) {
        console.error('❌ Database setup failed:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔒 Database connection closed');
        }
    }
}

setupTables();
