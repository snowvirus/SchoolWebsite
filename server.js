require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Debug: Log environment variables (except password)
console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('PORT:', process.env.PORT);
console.log('Has DB_PASSWORD:', process.env.DB_PASSWORD ? 'Yes' : 'No');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

console.log('Database configuration (without password):', {
    host: dbConfig.host,
    user: dbConfig.user,
    database: dbConfig.database,
    hasPassword: dbConfig.password ? 'Yes' : 'No'
});

// Database connection
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('Successfully connected to the database');
        connection.release();
    })
    .catch(err => {
        console.error('Error connecting to the database:', err);
        console.error('Connection details:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            hasPassword: process.env.DB_PASSWORD ? 'Yes' : 'No'
        });
    });

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token.' });
        }
        req.user = user;
        next();
    });
};

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// API Routes

// Admin Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt:', { username });

        const [rows] = await pool.execute(
            'SELECT * FROM admin_users WHERE username = ?',
            [username]
        );

        console.log('User found:', rows.length > 0);

        if (rows.length === 0) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password_hash);
        console.log('Password valid:', validPassword);

        if (!validPassword) {
            console.log('Invalid password');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful');
        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
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

// Get Student by Admission Number
app.get('/api/students/:admissionNumber', async (req, res) => {
    try {
        const { admissionNumber } = req.params;

        const [rows] = await pool.query(
            'SELECT * FROM students WHERE admission_number = ?',
            [admissionNumber]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({
            error: 'Error fetching student data',
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get Student Grades
app.get('/api/grades/:admissionNumber', async (req, res) => {
    try {
        const { admissionNumber } = req.params;
        const { term, year } = req.query;

        // First get the student ID
        const [student] = await pool.execute(
            'SELECT id FROM students WHERE admission_number = ?',
            [admissionNumber]
        );

        if (student.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        // Then get the grades with subject names
        const [grades] = await pool.execute(`
            SELECT g.*, s.subject_name 
            FROM grades g
            JOIN subjects s ON g.subject_id = s.id
            WHERE g.student_id = ? AND g.term = ? AND g.year = ?
        `, [student[0].id, term, year]);

        res.json(grades);
    } catch (error) {
        console.error('Error fetching grades:', error);
        res.status(500).json({
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
            'admissionNumber', 'firstName', 'lastName', 'dateOfBirth',
            'gender', 'class', 'parentName', 'parentPhone'
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

        // Check if admission number already exists
        const [existingStudent] = await pool.execute(
            'SELECT admission_number FROM students WHERE admission_number = ?',
            [studentData.admissionNumber]
        );

        if (existingStudent.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Student with admission number ${studentData.admissionNumber} already exists. Please use a different admission number.`
            });
        }

        // Insert student data
        const [result] = await pool.execute(
            `INSERT INTO students 
            (admission_number, first_name, last_name, date_of_birth, gender, class, stream,
            parent_name, parent_phone, parent_email, address) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                studentData.admissionNumber,
                studentData.firstName,
                studentData.lastName,
                studentData.dateOfBirth,
                studentData.gender,
                studentData.class,
                'A', // Default stream value
                studentData.parentName,
                studentData.parentPhone,
                studentData.parentEmail || '',
                studentData.address || ''
            ]
        );

        console.log('Registration successful:', result);
        res.json({
            success: true,
            message: 'Student registered successfully',
            admissionNumber: studentData.admissionNumber,
            id: result.insertId
        });
    } catch (error) {
        console.error('Registration error:', error);

        // Handle specific MySQL errors
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: `Student with admission number ${studentData.admissionNumber} already exists. Please use a different admission number.`
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
app.get('/api/report-cards/:studentId/download', authenticateToken, async (req, res) => {
    try {
        const { studentId } = req.params;

        // Get student details
        const [students] = await pool.execute(
            'SELECT * FROM students WHERE id = ?',
            [studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const student = students[0];

        // Get student's grades
        const [grades] = await pool.execute(
            'SELECT * FROM grades WHERE student_id = ?',
            [studentId]
        );

        // Create a new PDF document
        const doc = new PDFDocument();

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=report-card-${student.admission_number}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add content to PDF
        doc.fontSize(20).text('Report Card', { align: 'center' });
        doc.moveDown();

        // Student details
        doc.fontSize(12).text(`Student: ${student.first_name} ${student.last_name}`);
        doc.text(`Admission Number: ${student.admission_number}`);
        doc.text(`Class: ${student.class}`);
        doc.moveDown();

        // Grades table
        if (grades.length > 0) {
            doc.fontSize(14).text('Grades', { align: 'center' });
            doc.moveDown();

            // Table headers
            const tableHeaders = ['Subject', 'Grade', 'Term', 'Year'];
            const tableData = grades.map(grade => [
                grade.subject,
                grade.grade,
                grade.term,
                grade.year
            ]);

            // Draw table
            doc.fontSize(10);
            let y = doc.y;
            const rowHeight = 20;
            const colWidth = 120;

            // Draw headers
            tableHeaders.forEach((header, i) => {
                doc.text(header, 50 + (i * colWidth), y);
            });

            // Draw rows
            tableData.forEach((row, rowIndex) => {
                y += rowHeight;
                row.forEach((cell, colIndex) => {
                    doc.text(cell, 50 + (colIndex * colWidth), y);
                });
            });
        } else {
            doc.text('No grades available for this student.');
        }

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Error generating report card:', error);
        res.status(500).json({ error: 'Failed to generate report card' });
    }
});

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

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
    console.error('Server startup error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please choose a different port.`);
    }
}); 