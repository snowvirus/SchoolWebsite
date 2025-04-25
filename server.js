require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { initializeDatabase } = require('./src/database/initDatabase');
const studentRoutes = require('./src/routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Log environment variables (except password)
console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('PORT:', process.env.PORT);
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

// Middleware
app.use(cors());
app.use(express.json());

// Redirect root to login page FIRST
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Serve static files from the public directory AFTER checking root redirect
app.use(express.static(path.join(__dirname, 'src/public')));

// Serve static files from src/shared for dashboard styles/utils
app.use('/shared', express.static(path.join(__dirname, 'src/shared')));

// Serve student-specific JS file
app.use('/student', express.static(path.join(__dirname, 'src/student')));

// Authentication middleware
const authenticateToken = (req, res, next) => {
    // Define public routes/patterns that bypass ALL checks in this middleware
    const publicPaths = [
        /^\/login\.html$/,
        /^\/registration\.html$/,
        /^\/api\/auth\/login$/,
        /^\/api\/students$/,
        /^\/images\//, // Allow static assets
        /^\/css\//,
        /^\/js\//
    ];

    // Check if the requested path matches any public pattern
    if (publicPaths.some(pattern => pattern.test(req.path))) {
        console.log(`Auth Bypass: Public path ${req.path}`);
        return next(); // Skip auth for public paths
    }

    // For API routes, require a token from the header
    if (req.path.startsWith('/api/')) {
        console.log(`Auth Check: API path ${req.path}, checking token header...`);
        const token = req.headers['authorization']?.split(' ')[1];
        if (!token) {
            console.log(`Auth Fail: API path ${req.path} - Token missing`);
            return res.status(401).json({ error: 'Authentication token required' });
        }

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => { // Use JWT_SECRET constant
            if (err) {
                console.log(`Auth Fail: API path ${req.path} - Token invalid/expired`, err.message);
                return res.status(401).json({ error: 'Invalid or expired token' });
            }
            console.log(`Auth OK: API path ${req.path} - Token valid for user`, user.username);
            req.user = user; // Attach user info to the request for API handlers
            next();
        });
    } else {
        // For non-API, non-public HTML page routes (like /student/dashboard)
        // Rely on client-side JS to check localStorage for the token
        console.log(`Auth Bypass: Non-API path ${req.path}, allowing server-side load.`);
        // We could optionally do a basic token *cookie* check here if implemented
        next();
    }
};

// Protect all routes except public ones
app.use(authenticateToken);

// Serve other pages
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public', 'admin.html'));
});

app.get('/admin-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public', 'admin-login.html'));
});

app.get('/index', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/public', 'index.html'));
});

// Serve Student Dashboard (Existing file)
app.get('/student/dashboard', (req, res) => {
    // This route is protected by authenticateToken middleware already
    res.sendFile(path.join(__dirname, 'src/student', 'dashboard.html'));
});

// Serve Admin Dashboard (Existing file)
app.get('/admin/dashboard', (req, res) => {
    // Protected by authenticateToken
    res.sendFile(path.join(__dirname, 'src/admin', 'dashboard.html')); 
});

// Add routes for other student pages
const studentPages = ['academic', 'attendance', 'assignments', 'library', 'messages', 'profile'];
studentPages.forEach(page => {
    app.get(`/student/${page}`, (req, res) => {
        // Protected by authenticateToken
        res.sendFile(path.join(__dirname, 'src/student', `${page}.html`));
    });
});

// Database configuration (without password)
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Log configuration without sensitive data
console.log('Database configuration (without password):', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    hasPassword: dbConfig.password ? 'Yes' : 'No'
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'src/public/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Database connection
const pool = mysql.createPool(dbConfig);

// Initialize database and start server
async function startServer() {
    try {
        // Test database connection
        const connection = await pool.getConnection();
        console.log('Successfully connected to the database');
        connection.release();

        // Initialize database tables
        await initializeDatabase(pool);
        console.log('Database tables initialized successfully');

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Access the website at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
        process.exit(1);
    }
}

// Start the server
startServer();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// API Routes

// Admin Login
app.post('/api/auth/login', async (req, res) => {
    try {
        // Get username and password from request body
        const { username, password } = req.body;
        console.log('Login attempt for username:', username);

        // Find user by username in the 'users' table
        const [rows] = await pool.execute(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            console.log('User not found:', username);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];

        // Verify the password using bcrypt
        const hashedPassword = user.password;
        console.log('--- Password Comparison Debug ---');
        console.log('Password received from request:', password);
        console.log('Hashed password retrieved from DB:', hashedPassword);
        const validPassword = await bcrypt.compare(password, hashedPassword);
        // const storedPassword = user.password; // TEMP Plain text comparison
        // const validPassword = (password === storedPassword); // TEMP Direct string comparison
        // console.log('TEMP DEBUG: Comparing plain text password. Valid:', validPassword);
        console.log('Password valid for', username, ':', validPassword);

        if (!validPassword) {
            console.log('Invalid password for user:', username);
            // console.log('Invalid password for user (plain text check):', username); // Temp log
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.is_active) {
            console.log('User account is inactive:', username);
            return res.status(403).json({ message: 'Account is inactive. Please contact administrator.' });
        }

        // Create JWT token including user details
        const token = jwt.sign(
            { id: user.id, username: user.username, roleId: user.role_id }, // Use role_id
            JWT_SECRET, // Use the defined JWT_SECRET constant
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', username);
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                roleId: user.role_id // Include role_id in the response
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get Statistics
app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching statistics...');

        // Get total students
        const [studentCount] = await pool.execute('SELECT COUNT(*) as count FROM students');
        console.log('Student count:', studentCount[0].count);

        // Get active teachers
        const [teacherCount] = await pool.execute(
            'SELECT COUNT(*) as count FROM teachers WHERE status = "Active"'
        );
        console.log('Teacher count:', teacherCount[0].count);

        // Get total classes
        const [classCount] = await pool.execute('SELECT COUNT(*) as count FROM classes');
        console.log('Class count:', classCount[0].count);

        // Get pending tasks (absent students today + pending grades)
        const [absentToday] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM attendance 
            WHERE date = CURDATE() AND status = 'Absent'
        `);
        console.log('Absent today:', absentToday[0].count);

        const [pendingGrades] = await pool.execute(`
            SELECT COUNT(DISTINCT s.id) as count
            FROM students s
            LEFT JOIN grades g ON s.id = g.student_id 
                AND g.term = 1 
                AND g.year = YEAR(CURDATE())
            WHERE g.id IS NULL
        `);
        console.log('Pending grades:', pendingGrades[0].count);

        const pendingTasks = absentToday[0].count + pendingGrades[0].count;
        console.log('Total pending tasks:', pendingTasks);

        res.json({
            totalStudents: studentCount[0].count || 0,
            activeTeachers: teacherCount[0].count || 0,
            totalClasses: classCount[0].count || 0,
            pendingTasks: pendingTasks || 0
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            message: 'Error fetching statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get students by class and stream
app.get('/api/students', async (req, res) => {
    try {
        const { class: classValue, stream } = req.query;

        if (!classValue || !stream) {
            return res.status(400).json({
                error: 'Class and stream are required'
            });
        }

        const [rows] = await pool.execute(
            'SELECT * FROM students WHERE class = ? AND stream = ?',
            [classValue, stream]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            error: 'Failed to fetch students',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get student by registration number
app.get('/api/students/:registrationNumber', async (req, res) => {
    try {
        const { registrationNumber } = req.params;
        console.log('Fetching student with registration number:', registrationNumber);

        const [rows] = await pool.execute(
            'SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.registration_number = ?',
            [registrationNumber]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = rows[0];
        console.log('Found student:', student);

        res.json({
            success: true,
            data: {
                id: student.id,
                registrationNumber: student.registration_number,
                firstName: student.first_name,
                lastName: student.last_name,
                dateOfBirth: student.date_of_birth,
                gender: student.gender,
                class: student.class_name,
                stream: student.stream,
                parentName: student.parent_name,
                parentPhone: student.parent_phone,
                parentEmail: student.parent_email,
                address: student.address,
                enrollmentDate: student.enrollment_date
            }
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student data',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get Student Grades
app.get('/api/grades/:registrationNumber', async (req, res) => {
    try {
        const { registrationNumber } = req.params;
        const { term, year } = req.query;

        // First get the student ID
        const [student] = await pool.execute(
            'SELECT id FROM students WHERE registration_number = ?',
            [registrationNumber]
        );

        if (student.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }

        // Then get the grades with subject names
        const [grades] = await pool.execute(`
            SELECT g.*, s.name as subject_name 
            FROM grades g
            JOIN subjects s ON g.subject_id = s.id
            WHERE g.student_id = ? AND g.term = ? AND g.year = ?
        `, [student[0].id, term, year]);

        res.json({
            success: true,
            data: grades
        });
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching grades',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Student Registration
app.post('/api/students', async (req, res) => {
    try {
        const studentData = req.body;
        console.log('Received registration data:', studentData);

        // Validate required fields
        const requiredFields = [
            'registrationNumber', 'firstName', 'lastName', 'dateOfBirth',
            'gender', 'class', 'stream', 'parentName', 'parentPhone'
        ];

        const missingFields = requiredFields.filter(field => !studentData[field]);
        if (missingFields.length > 0) {
            console.log('Missing fields:', missingFields);
            return res.status(400).json({
                success: false,
                message: 'Missing required fields',
                missingFields: missingFields.map(field => ({
                    field,
                    value: studentData[field]
                }))
            });
        }

        // Start a transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            console.log('Creating student record...');

            // First, get the student role ID
            const [roleResult] = await connection.execute(
                'SELECT id FROM user_roles WHERE name = ?',
                ['student']
            );

            if (roleResult.length === 0) {
                throw new Error('Student role not found');
            }

            // Create a user record
            const [userResult] = await connection.execute(
                `INSERT INTO users 
                (username, password, email, role_id, is_active) 
                VALUES (?, ?, ?, ?, ?)`,
                [
                    studentData.registrationNumber, // Use registration number as username
                    '$2a$10$defaultpassword', // Default hashed password
                    studentData.parentEmail || `${studentData.registrationNumber}@school.com`,
                    roleResult[0].id,
                    true
                ]
            );

            // Get the class ID
            const [classResult] = await connection.execute(
                'SELECT id FROM classes WHERE name = ?',
                [studentData.class]
            );

            if (classResult.length === 0) {
                throw new Error(`Class ${studentData.class} not found`);
            }

            // Insert student data
            const [result] = await connection.execute(
                `INSERT INTO students 
                (registration_number, first_name, last_name, date_of_birth, gender, 
                class_id, parent_name, parent_phone, parent_email, address, enrollment_date) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())`,
                [
                    studentData.registrationNumber,
                    studentData.firstName,
                    studentData.lastName,
                    studentData.dateOfBirth,
                    studentData.gender === 'male' ? 'M' : 'F',
                    classResult[0].id,
                    studentData.parentName,
                    studentData.parentPhone,
                    studentData.parentEmail || null,
                    studentData.address || ''
                ]
            );

            console.log('Student record created successfully');
            await connection.commit();
            console.log('Transaction committed');
            
            res.json({
                success: true,
                message: 'Student registered successfully',
                registrationNumber: studentData.registrationNumber,
                id: result.insertId
            });
        } catch (error) {
            console.error('Error during registration transaction:', error);
            console.error('Error details:', {
                code: error.code,
                errno: error.errno,
                sqlMessage: error.sqlMessage,
                sqlState: error.sqlState,
                sql: error.sql
            });
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Registration error:', error);

        // Handle specific MySQL errors
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: `Student with registration number ${req.body.registrationNumber} already exists. Please use a different registration number.`
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error registering student',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Save Attendance
app.post('/api/attendance', authenticateToken, async (req, res) => {
    try {
        const { date, class: className, stream, attendance } = req.body;

        // Insert attendance records
        for (const record of attendance) {
            await pool.execute(
                `INSERT INTO attendance 
                (student_id, date, status, remarks) 
                SELECT id, ?, ?, ? 
                FROM students 
                WHERE admission_number = ? AND class = ? AND stream = ?`,
                [date, record.status, record.remarks, record.admissionNumber, className, stream]
            );
        }

        res.json({ success: true, message: 'Attendance saved successfully' });
    } catch (error) {
        console.error('Attendance error:', error);
        res.status(500).json({ message: 'Error saving attendance' });
    }
});

// Save Grades
app.post('/api/grades', authenticateToken, async (req, res) => {
    try {
        const { studentId, subjectId, term, year, marks, grade, remarks } = req.body;

        await pool.execute(
            `INSERT INTO grades 
            (student_id, subject_id, term, year, marks, grade, remarks) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [studentId, subjectId, term, year, marks, grade, remarks]
        );

        res.json({ success: true, message: 'Grade saved successfully' });
    } catch (error) {
        console.error('Grade error:', error);
        res.status(500).json({ message: 'Error saving grade' });
    }
});

// Download Report Card
app.get('/api/report-cards/:registrationNumber/download', authenticateToken, async (req, res) => {
    try {
        const { registrationNumber } = req.params;
        const { term, year } = req.query;

        if (!term || !year) {
            return res.status(400).json({ 
                success: false,
                message: 'Term and year are required' 
            });
        }

        // Get student details with class name
        const [students] = await pool.execute(
            'SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.registration_number = ?',
            [registrationNumber]
        );

        if (students.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'Student not found' 
            });
        }

        const student = students[0];

        // Get student's grades with subject names
        const [grades] = await pool.execute(`
            SELECT g.*, s.name as subject_name 
            FROM grades g
            JOIN subjects s ON g.subject_id = s.id
            WHERE g.student_id = ? AND g.term = ? AND g.year = ?
        `, [student.id, term, year]);

        // Create a new PDF document
        const doc = new PDFDocument();

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-card-${student.registration_number}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add school logo and header
        doc.fontSize(20).text('St Francis Secondary School', { align: 'center' });
        doc.fontSize(14).text('Kiboga District, Uganda', { align: 'center' });
        doc.moveDown();
        doc.fontSize(16).text('Student Report Card', { align: 'center' });
        doc.moveDown();

        // Add term and year
        doc.fontSize(12).text(`Term ${term}, ${year}`, { align: 'center' });
        doc.moveDown();

        // Student details
        doc.fontSize(12);
        doc.text(`Student Name: ${student.first_name} ${student.last_name}`);
        doc.text(`Registration Number: ${student.registration_number}`);
        doc.text(`Class: ${student.class_name}`);
        doc.text(`Date of Birth: ${new Date(student.date_of_birth).toLocaleDateString()}`);
        doc.text(`Parent/Guardian: ${student.parent_name}`);
        doc.moveDown();

        // Grades table
        if (grades.length > 0) {
            // Calculate total and average
            let totalMarks = 0;
            grades.forEach(grade => totalMarks += grade.marks);
            const averageMarks = (totalMarks / grades.length).toFixed(2);

            doc.fontSize(14).text('Academic Performance', { align: 'center' });
            doc.moveDown();

            // Table headers
            const tableHeaders = ['Subject', 'Marks', 'Grade', 'Remarks'];
            const tableData = grades.map(grade => [
                grade.subject_name,
                grade.marks.toString(),
                grade.grade,
                grade.remarks || '-'
            ]);

            // Draw table
            doc.fontSize(10);
            let y = doc.y;
            const rowHeight = 20;
            const colWidths = [200, 100, 100, 140];
            let xOffset = 50;

            // Draw headers
            tableHeaders.forEach((header, i) => {
                doc.text(header, xOffset, y, { width: colWidths[i], align: 'left' });
                xOffset += colWidths[i];
            });

            // Draw rows
            y += rowHeight;
            tableData.forEach((row) => {
                xOffset = 50;
                row.forEach((cell, i) => {
                    doc.text(cell, xOffset, y, { width: colWidths[i], align: 'left' });
                    xOffset += colWidths[i];
                });
                y += rowHeight;
            });

            // Add summary
            doc.moveDown();
            doc.fontSize(12);
            doc.text(`Total Marks: ${totalMarks}`);
            doc.text(`Average Marks: ${averageMarks}`);
            doc.text(`Overall Grade: ${calculateGrade(averageMarks)}`);
        } else {
            doc.text('No grades available for this term.');
        }

        // Add signature lines
        doc.moveDown(4);
        doc.fontSize(10);
        doc.text('_______________________', 50, doc.y);
        doc.text('_______________________', 400, doc.y);
        doc.moveDown();
        doc.text('Class Teacher', 50);
        doc.text('Principal', 400);

        // Add footer
        doc.fontSize(8);
        doc.text(`Generated on ${new Date().toLocaleDateString()}`, 50, doc.page.height - 50);

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Error generating report card:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to generate report card',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper function to calculate grade
function calculateGrade(marks) {
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 60) return 'C';
    if (marks >= 50) return 'D';
    return 'F';
}

// Download Calendar
app.get('/api/calendar/download', authenticateToken, async (req, res) => {
    try {
        const [events] = await pool.query('SELECT * FROM calendar_events ORDER BY date');

        const doc = new PDFDocument();
        const filename = 'school-calendar.pdf';

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        doc.pipe(res);

        doc.fontSize(20).text('School Calendar', { align: 'center' });
        doc.moveDown();

        events.forEach(event => {
            doc.fontSize(14).text(event.title);
            doc.fontSize(12).text(`Date: ${new Date(event.date).toLocaleDateString()}`);
            doc.fontSize(12).text(`Description: ${event.description || 'No description'}`);
            doc.moveDown();
        });

        doc.end();
    } catch (error) {
        console.error('Error generating calendar:', error);
        res.status(500).json({ error: 'Error generating calendar' });
    }
});

// Calendar events endpoints
app.post('/api/calendar-events', authenticateToken, async (req, res) => {
    try {
        const { title, description, date } = req.body;
        const created_by = req.user.id;

        if (!title || !description || !date) {
            return res.status(400).json({ error: 'Title, description, and date are required' });
        }

        const [result] = await pool.execute(
            'INSERT INTO calendar_events (title, description, date, created_by) VALUES (?, ?, ?, ?)',
            [title, description, date, created_by]
        );

        res.status(201).json({
            id: result.insertId,
            title,
            description,
            date,
            created_by,
            created_at: new Date()
        });
    } catch (error) {
        console.error('Error creating calendar event:', error);
        res.status(500).json({ error: 'Failed to create calendar event' });
    }
});

app.get('/api/calendar-events', async (req, res) => {
    try {
        const [events] = await pool.execute(
            'SELECT e.*, a.username as created_by_name FROM calendar_events e JOIN admin_users a ON e.created_by = a.id ORDER BY e.date ASC'
        );
        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
});

app.put('/api/calendar-events/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, date } = req.body;

        if (!title || !description || !date) {
            return res.status(400).json({ error: 'Title, description, and date are required' });
        }

        const [result] = await pool.execute(
            'UPDATE calendar_events SET title = ?, description = ?, date = ? WHERE id = ?',
            [title, description, date, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating calendar event:', error);
        res.status(500).json({ error: 'Failed to update calendar event' });
    }
});

app.delete('/api/calendar-events/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.execute('DELETE FROM calendar_events WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        res.status(500).json({ error: 'Failed to delete calendar event' });
    }
});

// Register routes
app.use('/api/students', studentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
}); 