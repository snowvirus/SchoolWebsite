const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// Get all teachers
router.get('/', async (req, res) => {
    try {
        const [teachers] = await pool.execute('SELECT * FROM teachers');
        res.json(teachers);
    } catch (error) {
        logger.error('Error fetching teachers:', error);
        res.status(500).json({ message: 'Error fetching teachers' });
    }
});

// Get teacher by ID
router.get('/:id', async (req, res) => {
    try {
        const [teachers] = await pool.execute('SELECT * FROM teachers WHERE id = ?', [req.params.id]);
        
        if (teachers.length === 0) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        res.json(teachers[0]);
    } catch (error) {
        logger.error('Error fetching teacher:', error);
        res.status(500).json({ message: 'Error fetching teacher' });
    }
});

// Create new teacher
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, subjectId } = req.body;
        
        const [result] = await pool.execute(
            'INSERT INTO teachers (firstName, lastName, email, phone, subjectId) VALUES (?, ?, ?, ?, ?)',
            [firstName, lastName, email, phone, subjectId]
        );
        
        res.status(201).json({
            id: result.insertId,
            firstName,
            lastName,
            email,
            phone,
            subjectId
        });
    } catch (error) {
        logger.error('Error creating teacher:', error);
        res.status(500).json({ message: 'Error creating teacher' });
    }
});

// Update teacher
router.put('/:id', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, subjectId } = req.body;
        
        const [result] = await pool.execute(
            'UPDATE teachers SET firstName = ?, lastName = ?, email = ?, phone = ?, subjectId = ? WHERE id = ?',
            [firstName, lastName, email, phone, subjectId, req.params.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        res.json({ message: 'Teacher updated successfully' });
    } catch (error) {
        logger.error('Error updating teacher:', error);
        res.status(500).json({ message: 'Error updating teacher' });
    }
});

// Delete teacher
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM teachers WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Teacher not found' });
        }
        
        res.json({ message: 'Teacher deleted successfully' });
    } catch (error) {
        logger.error('Error deleting teacher:', error);
        res.status(500).json({ message: 'Error deleting teacher' });
    }
});

module.exports = router; 