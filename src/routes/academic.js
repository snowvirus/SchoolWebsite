const express = require('express');
const router = express.Router();
const { pool } = require('../database/initDatabase');

// Get all subjects
router.get('/subjects', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM subjects');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get class subjects
router.get('/class-subjects/:classId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT s.*, cs.teacher_id FROM subjects s ' +
            'JOIN class_subjects cs ON s.id = cs.subject_id ' +
            'WHERE cs.class_id = ?',
            [req.params.classId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching class subjects:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get academic records for a class
router.get('/class-records/:classId', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT ar.*, s.firstName, s.lastName FROM academic_records ar ' +
            'JOIN students s ON ar.student_id = s.id ' +
            'WHERE ar.class_id = ? ' +
            'ORDER BY s.lastName, s.firstName, ar.year DESC, ar.term DESC',
            [req.params.classId]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching class records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 