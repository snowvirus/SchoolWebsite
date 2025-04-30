const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

// Register a new student
router.post('/register', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            dateOfBirth,
            gender,
            parentName,
            parentPhone,
            parentEmail,
            address,
            class: classId,
            stream,
            previousSchool,
            lastGrade
        } = req.body;

        // Generate admission number (year/sequence)
        const currentYear = new Date().getFullYear();
        const [countResult] = await req.pool.query(
            'SELECT COUNT(*) as count FROM students WHERE YEAR(created_at) = ?',
            [currentYear]
        );
        const sequence = (countResult[0].count + 1).toString().padStart(3, '0');
        const admissionNumber = `${currentYear}/${sequence}`;

        console.log('Generated admission number:', admissionNumber);

        // Check if class exists
        const [classStreamResult] = await req.pool.query(
            'SELECT id FROM classes WHERE id = ?',
            [classId]
        );

        if (classStreamResult.length === 0) {
            console.log('Invalid class:', { class: classId });
            return res.status(400).json({ error: 'Invalid class selected' });
        }

        // Get stream ID based on class and stream name
        const [streamResult] = await req.pool.query(
            'SELECT id FROM streams WHERE class_id = ? AND name = ?',
            [classId, stream]
        );

        if (streamResult.length === 0) {
            console.log('Invalid stream for class:', { class: classId, stream });
            return res.status(400).json({ error: 'Invalid stream for selected class' });
        }

        const streamId = streamResult[0].id;

        // Insert student record
        const [result] = await req.pool.query(
            `INSERT INTO students (
                admissionNumber, firstName, lastName, dateOfBirth, gender,
                class_id, stream_id, parentName, parentPhone, parentEmail,
                address, previousSchool, lastGrade
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                admissionNumber, firstName, lastName, dateOfBirth, gender,
                classId, streamId, parentName, parentPhone, parentEmail,
                address, previousSchool, lastGrade
            ]
        );

        console.log('Student registered successfully:', { id: result.insertId, admissionNumber });

        // Get the student's class and stream names
        const [studentData] = await req.pool.query(`
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

// Get student information
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            `SELECT s.*, u.email, c.name as className, st.name as streamName
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            WHERE s.id = ?`,
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching student:', error);
        res.status(500).json({ message: 'Error fetching student information' });
    }
});

// Generate QR code for student
router.get('/:id/qr', async (req, res) => {
    try {
        const [rows] = await pool.execute(
            'SELECT admissionNumber, firstName, lastName FROM students WHERE id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = rows[0];
        const qrData = JSON.stringify({
            id: req.params.id,
            registrationNumber: student.admissionNumber,
            name: `${student.firstName} ${student.lastName}`
        });

        const qrCode = await QRCode.toDataURL(qrData);
        res.send(`<img src="${qrCode}" alt="QR Code">`);
    } catch (error) {
        console.error('Error generating QR code:', error);
        res.status(500).json({ message: 'Error generating QR code' });
    }
});

// Get report card
router.get('/report-card', async (req, res) => {
    try {
        const { registrationNumber, term } = req.query;

        // Get student information
        const [studentRows] = await pool.execute(
            `SELECT s.*, u.email, c.name as className, st.name as streamName
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN classes c ON s.class_id = c.id
            LEFT JOIN streams st ON s.stream_id = st.id
            WHERE s.admissionNumber = ?`,
            [registrationNumber]
        );

        if (studentRows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }

        const student = studentRows[0];

        // Get grades
        const [gradeRows] = await pool.execute(
            `SELECT ar.*, s.name as subjectName
            FROM academic_records ar
            JOIN subjects s ON ar.subject_id = s.id
            WHERE ar.student_id = ? AND ar.term = ? AND ar.year = YEAR(CURRENT_DATE)`,
            [student.id, term]
        );

        // Calculate total marks and average grade
        const totalMarks = gradeRows.reduce((sum, grade) => sum + grade.marks, 0);
        const averageGrade = calculateGrade(totalMarks / gradeRows.length);

        res.json({
            student,
            grades: gradeRows.map(grade => ({
                subject: grade.subjectName,
                marks: grade.marks,
                grade: grade.grade,
                remarks: grade.remarks
            })),
            totalMarks,
            averageGrade,
            academicYear: new Date().getFullYear(),
            teacherRemarks: gradeRows[0] && gradeRows[0].teacherRemarks || '',
            principalRemarks: gradeRows[0] && gradeRows[0].principalRemarks || ''
        });
    } catch (error) {
        console.error('Error fetching report card:', error);
        res.status(500).json({ message: 'Error fetching report card' });
    }
});

// Get registration card
router.get('/:admissionNumber/registration-card', async (req, res) => {
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

        const [rows] = await req.pool.execute(query, [admissionNumber]);
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
            message: 'Error fetching student data'
        });
    }
});

// Helper function to calculate grade
function calculateGrade(average) {
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average >= 50) return 'D';
    return 'F';
}

module.exports = router; 