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
const studentRoutes = require('./src/routes/students');
const adminRoutes = require('./src/routes/admin');
const authRoutes = require('./src/routes/auth');
const teacherRoutes = require('./src/routes/teacher');
const logger = require('./src/utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Database pool (will be initialized in startServer)
let pool;

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

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Public routes
app.use('/api/auth', authRoutes);

// Protected routes
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/teacher', authenticateToken, teacherRoutes);
app.use('/api/student', authenticateToken, studentRoutes);

// Mount routes with pool
app.use('/api/students', (req, res, next) => {
    req.pool = pool;
    next();
}, studentRoutes);

// Get student registration card
app.get('/api/students/:admissionNumber/registration-card', async (req, res) => {
    try {
        const { admissionNumber } = req.params;
        console.log('=== Registration Card Request ===');
        console.log('Admission Number:', admissionNumber);

        // Get student details with class and stream information
        const query = `
            SELECT s.*, c.name as class_name, st.name as stream_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            WHERE s.admissionNumber = ?
        `;
        console.log('Executing query:', query);
        console.log('With parameters:', [admissionNumber]);

        const [rows] = await pool.execute(query, [admissionNumber]);
        console.log('Query results:', JSON.stringify(rows, null, 2));

        if (rows.length === 0) {
            console.log('No student found');
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = rows[0];
        console.log('Found student:', JSON.stringify(student, null, 2));

        // Get clearance records
        const clearanceQuery = `
            SELECT * FROM clearance_records 
            WHERE student_id = ? AND academic_year = YEAR(CURRENT_DATE)
        `;
        const [clearanceRows] = await pool.execute(clearanceQuery, [student.id]);
        console.log('Clearance records:', JSON.stringify(clearanceRows, null, 2));

        const clearance = clearanceRows[0] || {
            library_cleared: false,
            accounts_cleared: false,
            sports_cleared: false,
            lab_cleared: false,
            hostel_cleared: false
        };

        // Format the response
        const response = {
            success: true,
            data: {
                student: {
                    admissionNumber: student.admissionNumber,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    dateOfBirth: student.dateOfBirth,
                    gender: student.gender,
                    class: student.class_name || `Form ${student.class_id}`,
                    stream: student.stream_name || `Stream ${student.stream_id}`,
                    parentName: student.parentName,
                    parentPhone: student.parentPhone,
                    parentEmail: student.parentEmail,
                    address: student.address,
                    previousSchool: student.previousSchool,
                    lastGrade: student.lastGrade,
                    academicYear: new Date().getFullYear(),
                    issueDate: new Date().toISOString(),
                    clearance: {
                        library: clearance.library_cleared,
                        accounts: clearance.accounts_cleared,
                        sports: clearance.sports_cleared,
                        lab: clearance.lab_cleared,
                        hostel: clearance.hostel_cleared
                    }
                }
            }
        };

        console.log('Sending response:', JSON.stringify(response, null, 2));
        res.json(response);
    } catch (error) {
        console.error('=== Error in Registration Card ===');
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            errno: error.errno,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Error fetching student data: ' + error.message
        });
    }
});

// Redirect root to login page
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'src/public')));

// Serve static files from src/shared for dashboard styles/utils
app.use('/shared', express.static(path.join(__dirname, 'src/shared')));

// Serve student-specific JS file
app.use('/student', express.static(path.join(__dirname, 'src/student')));

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
app.get('/student/dashboard.html', (req, res) => {
    // This route is protected by authenticateToken middleware already
    res.sendFile(path.join(__dirname, 'src/student', 'dashboard.html'));
});

// Serve Admin Dashboard (Existing file)
app.get('/admin/dashboard.html', (req, res) => {
    // Protected by authenticateToken
    res.sendFile(path.join(__dirname, 'src/admin', 'dashboard.html')); 
});

// Add routes for other student pages
const studentPages = ['academic', 'attendance', 'assignments', 'library', 'messages', 'profile'];
studentPages.forEach(page => {
    app.get(`/student/${page}.html`, (req, res) => {
        // Protected by authenticateToken
        res.sendFile(path.join(__dirname, 'src/student', `${page}.html`));
    });
});

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'Security@12',
    database: 'school_management',
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

// Initialize database and start server
async function startServer() {
    try {
        // Create pool with database specified
        pool = mysql.createPool(dbConfig);

        // Test database connection
        const connection = await pool.getConnection();
        console.log('Successfully connected to the database');
        
        // Test a simple query
        const [testRows] = await connection.execute('SELECT 1 as test');
        console.log('Test query result:', testRows);
        
        // Test students table
        const [studentRows] = await connection.execute('SELECT * FROM students WHERE admissionNumber = ?', ['2025/001']);
        console.log('Student test query result:', JSON.stringify(studentRows, null, 2));
        
        connection.release();
        console.log('Released test connection');

        // Mount routes with pool
        app.use('/api/students', (req, res, next) => {
            req.pool = pool;
            next();
        }, studentRoutes);
        app.use('/api/admin', (req, res, next) => {
            req.pool = pool;
            next();
        }, adminRoutes);

        // Start the server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Access the website at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Error starting server:', err);
        console.error('Error details:', {
            message: err.message,
            code: err.code,
            errno: err.errno,
            sqlMessage: err.sqlMessage,
            sqlState: err.sqlState
        });
        process.exit(1);
    }
}

// Start the server
startServer();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// API Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        console.log('Login attempt for username:', username, 'role:', role);

        if (role === 'student') {
            // Check students table
            const [studentRows] = await pool.execute(
                'SELECT * FROM students WHERE admissionNumber = ?',
                [username]
            );

            if (studentRows.length === 0) {
                console.log('Student not found:', username);
                return res.status(401).json({ message: 'Invalid admission number' });
            }

            const student = studentRows[0];
            // For students, we'll use their admission number as password initially
            if (password !== student.admissionNumber) {
                console.log('Invalid password for student:', username);
                return res.status(401).json({ message: 'Invalid password' });
            }

            const token = jwt.sign(
                { 
                    id: student.id, 
                    username: student.admissionNumber, 
                    role: 'student',
                    roleId: 3 // Student role ID
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({ 
                token, 
                user: { 
                    id: student.id, 
                    username: student.admissionNumber, 
                    role: 'student',
                    roleId: 3,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    class: student.class_id,
                    stream: student.stream_id
                } 
            });
        }

        // Admin login logic
        if (role === 'admin') {
            const [adminRows] = await pool.execute(
                'SELECT * FROM admin_users WHERE username = ?',
                [username]
            );

            if (adminRows.length > 0) {
                const admin = adminRows[0];
                const validPassword = await bcrypt.compare(password, admin.password);
                
                if (validPassword) {
                    const token = jwt.sign(
                        { 
                            id: admin.id, 
                            username: admin.username, 
                            role: 'admin',
                            roleId: 1 // Admin role ID
                        },
                        JWT_SECRET,
                        { expiresIn: '24h' }
                    );
                    return res.json({ 
                        token, 
                        user: { 
                            id: admin.id, 
                            username: admin.username, 
                            role: 'admin',
                            roleId: 1
                        } 
                    });
                }
            }
        }

        // If not found or invalid credentials
        return res.status(401).json({ message: 'Invalid credentials' });
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

        // Get total classes
        const [classCount] = await pool.execute('SELECT COUNT(*) as count FROM classes');
        console.log('Class count:', classCount[0].count);

        // Get pending tasks (absent students today + pending grades)
        const [absentToday] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM attendance 
            WHERE date = CURDATE() AND status = 'absent'
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
            activeTeachers: 0, // We'll implement this when we add the teachers table
            totalClasses: classCount[0].count || 0,
            pendingTasks: pendingTasks || 0
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
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

        // First get the class ID
        const [classRows] = await pool.execute(
            'SELECT id FROM classes WHERE name = ?',
            [classValue]
        );

        if (classRows.length === 0) {
            return res.status(404).json({
                error: 'Class not found'
            });
        }

        const classId = classRows[0].id;

        // Then get the stream ID
        const [streamRows] = await pool.execute(
            'SELECT id FROM streams WHERE class_id = ? AND name = ?',
            [classId, stream]
        );

        if (streamRows.length === 0) {
            return res.status(404).json({
                error: 'Stream not found for this class'
            });
        }

        const streamId = streamRows[0].id;

        // Finally get the students
        const [students] = await pool.execute(
            'SELECT * FROM students WHERE class_id = ? AND stream_id = ?',
            [classId, streamId]
        );

        res.json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({
            error: 'Failed to fetch students',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get student by registration number
app.get('/api/grades/:admissionNumber', async (req, res) => {
    try {
        const { admissionNumber } = req.params;
        const { term, year } = req.query;
        
        // Validate required query parameters
        if (!term || !year) {
            return res.status(400).json({
                success: false,
                message: 'Term and year are required query parameters'
            });
        }

        // Parse term and year as numbers
        const termNum = parseInt(term);
        const yearNum = parseInt(year);

        if (isNaN(termNum) || isNaN(yearNum)) {
            return res.status(400).json({
                success: false,
                message: 'Term and year must be valid numbers'
            });
        }

        console.log('Fetching grades for:', { admissionNumber, term: termNum, year: yearNum });

        // First get the student ID
        const [student] = await pool.execute(
            'SELECT id FROM students WHERE admissionNumber = ?',
            [admissionNumber]
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
        `, [student[0].id, termNum, yearNum]);

        // Get student details
        const [studentDetails] = await pool.execute(`
            SELECT s.*, c.name as class_name, st.name as stream_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            WHERE s.id = ?
        `, [student[0].id]);

        res.json({
            success: true,
            data: {
                student: {
                    admissionNumber: studentDetails[0].admissionNumber,
                    firstName: studentDetails[0].firstName,
                    lastName: studentDetails[0].lastName,
                    class: studentDetails[0].class_name,
                    stream: studentDetails[0].stream_name
                },
                grades: grades
            }
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
app.post('/api/students/register', async (req, res) => {
    console.log('Registration request received:', req.body);
    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            class: classValue,
            stream,
            parentName,
            parentPhone,
            parentEmail,
            address,
            previousSchool,
            lastGrade
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !dateOfBirth || !gender || !classValue || !stream) {
            console.log('Missing required fields:', { firstName, lastName, dateOfBirth, gender, class: classValue, stream });
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Generate admission number (year/sequence)
        const currentYear = new Date().getFullYear();
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as count FROM students WHERE YEAR(created_at) = ?',
            [currentYear]
        );
        const sequence = (countResult[0].count + 1).toString().padStart(3, '0');
        const admissionNumber = `${currentYear}/${sequence}`;

        console.log('Generated admission number:', admissionNumber);

        // Check if class exists
        const [classStreamResult] = await pool.query(
            'SELECT id FROM classes WHERE id = ?',
            [classValue]
        );

        if (classStreamResult.length === 0) {
            console.log('Invalid class:', { class: classValue });
            return res.status(400).json({ error: 'Invalid class selected' });
        }

        // Get stream ID based on class and stream name
        const [streamResult] = await pool.query(
            'SELECT id FROM streams WHERE class_id = ? AND name = ?',
            [classValue, stream]
        );

        if (streamResult.length === 0) {
            console.log('Invalid stream for class:', { class: classValue, stream });
            return res.status(400).json({ error: 'Invalid stream for selected class' });
        }

        const streamId = streamResult[0].id;

        // Insert student record
        const [result] = await pool.query(
            `INSERT INTO students (
                admissionNumber, firstName, lastName, dateOfBirth, gender,
                class_id, stream_id, parentName, parentPhone, parentEmail,
                address, previousSchool, lastGrade
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                admissionNumber, firstName, lastName, dateOfBirth, gender,
                classValue, streamId, parentName, parentPhone, parentEmail,
                address, previousSchool, lastGrade
            ]
        );

        console.log('Student registered successfully:', { id: result.insertId, admissionNumber });

        // Get the student's class and stream names
        const [studentData] = await pool.query(`
            SELECT s.*, c.name as class_name, st.name as stream_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            WHERE s.id = ?
        `, [result.insertId]);

        const student = studentData[0];

        res.status(201).json({
            success: true,
            message: 'Student registered successfully',
            data: {
                student: {
                    admissionNumber: student.admissionNumber,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    dateOfBirth: student.dateOfBirth,
                    gender: student.gender,
                    class: student.class_name,
                    stream: student.stream_name,
                    parentName: student.parentName,
                    parentPhone: student.parentPhone,
                    parentEmail: student.parentEmail,
                    address: student.address,
                    previousSchool: student.previousSchool,
                    lastGrade: student.lastGrade
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Student with this information already exists' });
        }
        if (error.code === 'ER_NO_REFERENCED_ROW') {
            return res.status(400).json({ error: 'Invalid class or stream selected' });
        }
        res.status(500).json({ error: 'Error registering student' });
    }
});

// Save Attendance
app.post('/api/attendance', async (req, res) => {
    try {
        const { date, class: className, stream, attendance } = req.body;

        // Get class and stream IDs
        const [classRows] = await pool.execute(
            'SELECT id FROM classes WHERE name = ?',
            [className]
        );

        if (classRows.length === 0) {
            return res.status(404).json({
                error: 'Class not found'
            });
        }

        const classId = classRows[0].id;

        const [streamRows] = await pool.execute(
            'SELECT id FROM streams WHERE class_id = ? AND name = ?',
            [classId, stream]
        );

        if (streamRows.length === 0) {
            return res.status(404).json({
                error: 'Stream not found for this class'
            });
        }

        const streamId = streamRows[0].id;

        // Insert attendance records
        for (const record of attendance) {
            await pool.execute(
                `INSERT INTO attendance 
                (student_id, date, status, remarks) 
                SELECT id, ?, ?, ? 
                FROM students 
                WHERE admissionNumber = ? AND class_id = ? AND stream_id = ?`,
                [date, record.status, record.remarks, record.admissionNumber, classId, streamId]
            );
        }

        res.json({ success: true, message: 'Attendance saved successfully' });
    } catch (error) {
        console.error('Attendance error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error saving attendance',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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

// Test endpoint to verify database connection and student data
app.get('/api/test/student/:admissionNumber', async (req, res) => {
    try {
        const { admissionNumber } = req.params;
        console.log('Testing database connection and student data for:', admissionNumber);

        // Test database connection
        const connection = await pool.getConnection();
        console.log('Database connection successful');
        connection.release();

        // Check if student exists
        const [studentRows] = await pool.execute(
            'SELECT * FROM students WHERE admissionNumber = ?',
            [admissionNumber]
        );
        console.log('Student query results:', studentRows);

        // Check classes table
        const [classRows] = await pool.execute('SELECT * FROM classes');
        console.log('Classes in database:', classRows);

        // Check streams table
        const [streamRows] = await pool.execute('SELECT * FROM streams');
        console.log('Streams in database:', streamRows);

        res.json({
            success: true,
            studentExists: studentRows.length > 0,
            studentData: studentRows[0] || null,
            classes: classRows,
            streams: streamRows
        });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({
            success: false,
            message: 'Error testing database connection',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Test endpoint to verify database structure
app.get('/api/test/db-structure', async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log('Got database connection for structure test');

        // Check students table
        const [studentColumns] = await connection.execute('SHOW COLUMNS FROM students');
        console.log('Students table columns:', JSON.stringify(studentColumns, null, 2));

        // Check classes table
        const [classColumns] = await connection.execute('SHOW COLUMNS FROM classes');
        console.log('Classes table columns:', JSON.stringify(classColumns, null, 2));

        // Check streams table
        const [streamColumns] = await connection.execute('SHOW COLUMNS FROM streams');
        console.log('Streams table columns:', JSON.stringify(streamColumns, null, 2));

        // Check clearance_records table
        const [clearanceColumns] = await connection.execute('SHOW COLUMNS FROM clearance_records');
        console.log('Clearance records table columns:', JSON.stringify(clearanceColumns, null, 2));

        res.json({
            success: true,
            tables: {
                students: studentColumns,
                classes: classColumns,
                streams: streamColumns,
                clearance_records: clearanceColumns
            }
        });
    } catch (error) {
        console.error('Error checking database structure:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking database structure',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        if (connection) {
            connection.release();
            console.log('Released database connection');
        }
    }
});

// Save clearance status
app.post('/api/students/:admissionNumber/clearance', async (req, res) => {
    try {
        const { admissionNumber } = req.params;
        const { library, accounts, sports, lab, hostel } = req.body;

        // Get student ID
        const [studentRows] = await pool.execute(
            'SELECT id FROM students WHERE admissionNumber = ?',
            [admissionNumber]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const studentId = studentRows[0].id;
        const currentYear = new Date().getFullYear();

        // Check if clearance record exists
        const [clearanceRows] = await pool.execute(
            'SELECT id FROM clearance_records WHERE student_id = ? AND academic_year = ?',
            [studentId, currentYear]
        );

        if (clearanceRows.length > 0) {
            // Update existing record
            await pool.execute(
                `UPDATE clearance_records 
                SET library_cleared = ?, accounts_cleared = ?, sports_cleared = ?, 
                    lab_cleared = ?, hostel_cleared = ?, updated_at = NOW()
                WHERE student_id = ? AND academic_year = ?`,
                [library, accounts, sports, lab, hostel, studentId, currentYear]
            );
        } else {
            // Insert new record
            await pool.execute(
                `INSERT INTO clearance_records 
                (student_id, academic_year, library_cleared, accounts_cleared, 
                sports_cleared, lab_cleared, hostel_cleared, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [studentId, currentYear, library, accounts, sports, lab, hostel]
            );
        }

        res.json({
            success: true,
            message: 'Clearance status saved successfully'
        });
    } catch (error) {
        console.error('Error saving clearance:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving clearance status'
        });
    }
});

// Check if attendance exists for a date
app.get('/api/attendance/check', async (req, res) => {
    try {
        const { date, class: className, stream } = req.query;

        if (!date || !className || !stream) {
            return res.status(400).json({
                success: false,
                message: 'Date, class, and stream are required'
            });
        }

        const [rows] = await pool.execute(
            `SELECT COUNT(*) as count 
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.date = ? AND s.class_id = ? AND s.stream_id = ?`,
            [date, className, stream]
        );

        res.json({
            success: true,
            exists: rows[0].count > 0
        });
    } catch (error) {
        console.error('Error checking attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking attendance'
        });
    }
});

// Get attendance for a date
app.get('/api/attendance', async (req, res) => {
    try {
        const { date, class: className, stream } = req.query;

        if (!date || !className || !stream) {
            return res.status(400).json({
                success: false,
                message: 'Date, class, and stream are required'
            });
        }

        const [rows] = await pool.execute(
            `SELECT s.admissionNumber, a.status, a.remarks
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            WHERE a.date = ? AND s.class_id = ? AND s.stream_id = ?`,
            [date, className, stream]
        );

        res.json(rows);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching attendance'
        });
    }
});

// Get student information
app.get('/api/students/:admissionNumber/info', authenticateToken, async (req, res) => {
    try {
        const { admissionNumber } = req.params;

        // Get student details with class and stream information
        const [rows] = await pool.execute(
            `SELECT s.*, c.name as class_name, st.name as stream_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            WHERE s.admissionNumber = ?`,
            [admissionNumber]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = rows[0];

        // Format the response
        const response = {
            success: true,
            data: {
                admissionNumber: student.admissionNumber,
                firstName: student.firstName,
                lastName: student.lastName,
                class: student.class_name,
                stream: student.stream_name,
                parentName: student.parentName,
                parentPhone: student.parentPhone,
                parentEmail: student.parentEmail,
                address: student.address,
                previousSchool: student.previousSchool,
                lastGrade: student.lastGrade
            }
        };

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching student info:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student information'
        });
    }
});

// Get student statistics
app.get('/api/students/:admissionNumber/stats', authenticateToken, async (req, res) => {
    try {
        const { admissionNumber } = req.params;

        // Get student ID
        const [studentRows] = await pool.execute(
            'SELECT id FROM students WHERE admissionNumber = ?',
            [admissionNumber]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const studentId = studentRows[0].id;

        // Get total subjects
        const [subjectCount] = await pool.execute(
            'SELECT COUNT(DISTINCT subject_id) as count FROM grades WHERE student_id = ?',
            [studentId]
        );

        // Get average grade
        const [gradeAvg] = await pool.execute(
            'SELECT AVG(marks) as average FROM grades WHERE student_id = ?',
            [studentId]
        );

        // Get attendance rate
        const [attendanceStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
            FROM attendance 
            WHERE student_id = ?`,
            [studentId]
        );

        const attendanceRate = attendanceStats[0].total > 0 
            ? (attendanceStats[0].present / attendanceStats[0].total) * 100 
            : 0;

        res.json({
            totalSubjects: subjectCount[0].count || 0,
            averageGrade: Math.round(gradeAvg[0].average || 0),
            attendanceRate: Math.round(attendanceRate)
        });
    } catch (error) {
        console.error('Error fetching student statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student statistics'
        });
    }
});

// Get student recent activity
app.get('/api/students/:admissionNumber/activity', authenticateToken, async (req, res) => {
    try {
        const { admissionNumber } = req.params;

        // Get student ID
        const [studentRows] = await pool.execute(
            'SELECT id FROM students WHERE admissionNumber = ?',
            [admissionNumber]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const studentId = studentRows[0].id;

        // Get recent grades
        const [grades] = await pool.execute(
            `SELECT 
                g.*,
                s.name as subject_name,
                'grade' as type,
                CONCAT('Grade received in ', s.name) as title,
                g.created_at as timestamp
            FROM grades g
            JOIN subjects s ON g.subject_id = s.id
            WHERE g.student_id = ?
            ORDER BY g.created_at DESC
            LIMIT 5`,
            [studentId]
        );

        // Get recent attendance
        const [attendance] = await pool.execute(
            `SELECT 
                *,
                'attendance' as type,
                CONCAT('Attendance marked as ', status) as title,
                created_at as timestamp
            FROM attendance
            WHERE student_id = ?
            ORDER BY created_at DESC
            LIMIT 5`,
            [studentId]
        );

        // Combine and sort activities
        const activities = [...grades, ...attendance]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 5);

        res.json(activities);
    } catch (error) {
        console.error('Error fetching student activity:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student activity'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Server error:', err);
    res.status(500).json({ message: 'Internal server error' });
}); 