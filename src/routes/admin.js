const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

// Get dashboard statistics
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        // Get total students
        const [students] = await pool.execute('SELECT COUNT(*) as count FROM students');
        const totalStudents = students[0].count;

        // Get active teachers
        const [teachers] = await pool.execute('SELECT COUNT(*) as count FROM teachers WHERE status = "active"');
        const activeTeachers = teachers[0].count;

        // Get total classes
        const [classes] = await pool.execute('SELECT COUNT(*) as count FROM classes');
        const totalClasses = classes[0].count;

        // Get pending tasks (e.g., pending attendance, grades to be entered)
        const [tasks] = await pool.execute(`
            SELECT COUNT(*) as count 
            FROM (
                SELECT id FROM attendance WHERE date = CURDATE() AND status IS NULL
                UNION ALL
                SELECT id FROM academic_records WHERE marks IS NULL
            ) as pending_tasks
        `);
        const pendingTasks = tasks[0].count;

        res.json({
            totalStudents,
            activeTeachers,
            totalClasses,
            pendingTasks
        });
    } catch (error) {
        logger.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Error fetching statistics' });
    }
});

// Add new student
router.post('/students', authenticateToken, async (req, res) => {
    try {
        const { fullName, admissionNumber, class: className } = req.body;

        // Validate input
        if (!fullName || !admissionNumber || !className) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if admission number already exists
        const [existing] = await pool.execute(
            'SELECT id FROM students WHERE admission_number = ?',
            [admissionNumber]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: 'Admission number already exists' });
        }

        // Get class ID
        const [classResult] = await pool.execute(
            'SELECT id FROM classes WHERE name = ?',
            [className]
        );

        if (classResult.length === 0) {
            return res.status(400).json({ message: 'Invalid class' });
        }

        // Insert student
        const [result] = await pool.execute(
            `INSERT INTO students (full_name, admission_number, class_id, created_at)
             VALUES (?, ?, ?, NOW())`,
            [fullName, admissionNumber, classResult[0].id]
        );

        res.status(201).json({
            message: 'Student added successfully',
            studentId: result.insertId
        });
    } catch (error) {
        logger.error('Error adding student:', error);
        res.status(500).json({ message: 'Error adding student' });
    }
});

// Get all students
router.get('/students', authenticateToken, async (req, res) => {
    try {
        const [students] = await pool.execute(`
            SELECT s.*, c.name as class_name
            FROM students s
            LEFT JOIN classes c ON s.class_id = c.id
            ORDER BY s.created_at DESC
        `);

        res.json(students);
    } catch (error) {
        logger.error('Error fetching students:', error);
        res.status(500).json({ message: 'Error fetching students' });
    }
});

// Update student
router.put('/students/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, className } = req.body;

        // Get class ID
        const [classResult] = await pool.execute(
            'SELECT id FROM classes WHERE name = ?',
            [className]
        );

        if (classResult.length === 0) {
            return res.status(400).json({ message: 'Invalid class' });
        }

        await pool.execute(
            `UPDATE students 
             SET full_name = ?, class_id = ?
             WHERE id = ?`,
            [fullName, classResult[0].id, id]
        );

        res.json({ message: 'Student updated successfully' });
    } catch (error) {
        logger.error('Error updating student:', error);
        res.status(500).json({ message: 'Error updating student' });
    }
});

// Delete student
router.delete('/students/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        await pool.execute('DELETE FROM students WHERE id = ?', [id]);

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        logger.error('Error deleting student:', error);
        res.status(500).json({ message: 'Error deleting student' });
    }
});

// Mark attendance
router.post('/attendance', authenticateToken, async (req, res) => {
    try {
        const { studentId, date, status } = req.body;

        // Validate input
        if (!studentId || !date || !status) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if attendance already marked
        const [existing] = await pool.execute(
            'SELECT id FROM attendance WHERE student_id = ? AND date = ?',
            [studentId, date]
        );

        if (existing.length > 0) {
            // Update existing attendance
            await pool.execute(
                `UPDATE attendance 
                 SET status = ?, updated_at = NOW()
                 WHERE student_id = ? AND date = ?`,
                [status, studentId, date]
            );
        } else {
            // Insert new attendance
            await pool.execute(
                `INSERT INTO attendance (student_id, date, status, recorded_by)
                 VALUES (?, ?, ?, ?)`,
                [studentId, date, status, req.user.id]
            );
        }

        res.json({ message: 'Attendance marked successfully' });
    } catch (error) {
        logger.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Error marking attendance' });
    }
});

// Create announcement
router.post('/announcements', authenticateToken, async (req, res) => {
    try {
        const { title, content, targetAudience } = req.body;

        // Validate input
        if (!title || !content || !targetAudience) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const [result] = await pool.execute(
            `INSERT INTO circulars (title, content, target_audience, published_by)
             VALUES (?, ?, ?, ?)`,
            [title, content, targetAudience, req.user.id]
        );

        res.status(201).json({
            message: 'Announcement created successfully',
            announcementId: result.insertId
        });
    } catch (error) {
        logger.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Error creating announcement' });
    }
});

module.exports = router; 