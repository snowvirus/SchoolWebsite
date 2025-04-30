const express = require('express');
const router = express.Router();
const { pool } = require('../database/initDatabase');

// Get student profile
router.get('/profile', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM students WHERE user_id = ?', [req.user.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Student not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get student attendance
router.get('/attendance', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Get student academic records
router.get('/academic-records', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM academic_records WHERE student_id = ? ORDER BY year DESC, term DESC',
            [req.user.id]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching academic records:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 