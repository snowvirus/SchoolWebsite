const express = require('express');
const router = express.Router();
const { pool } = require('../database/initDatabase');

// Get attendance for a class on a specific date
router.get('/class/:classId', async (req, res) => {
    try {
        const { date } = req.query;
        const [rows] = await pool.query(
            'SELECT a.*, s.firstName, s.lastName FROM attendance a ' +
            'JOIN students s ON a.student_id = s.id ' +
            'WHERE s.class_id = ? AND a.date = ? ' +
            'ORDER BY s.lastName, s.firstName',
            [req.params.classId, date]
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mark attendance for multiple students
router.post('/mark', async (req, res) => {
    try {
        const { date, records } = req.body;
        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            for (const record of records) {
                await connection.execute(
                    'INSERT INTO attendance (student_id, date, status, remarks, recorded_by) ' +
                    'VALUES (?, ?, ?, ?, ?) ' +
                    'ON DUPLICATE KEY UPDATE status = ?, remarks = ?',
                    [
                        record.student_id,
                        date,
                        record.status,
                        record.remarks,
                        req.user.id,
                        record.status,
                        record.remarks
                    ]
                );
            }
            
            await connection.commit();
            res.json({ message: 'Attendance marked successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 