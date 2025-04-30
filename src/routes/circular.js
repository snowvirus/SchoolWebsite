const express = require('express');
const router = express.Router();
const { pool } = require('../database/initDatabase');

// Get all circulars
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT c.*, u.full_name as publisher_name FROM circulars c ' +
            'JOIN users u ON c.published_by = u.id ' +
            'ORDER BY c.published_at DESC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching circulars:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create a new circular
router.post('/', async (req, res) => {
    try {
        const { title, content, target_audience, expiry_date } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO circulars (title, content, target_audience, published_by, expiry_date) ' +
            'VALUES (?, ?, ?, ?, ?)',
            [title, content, target_audience, req.user.id, expiry_date]
        );
        res.status(201).json({ id: result.insertId, message: 'Circular created successfully' });
    } catch (error) {
        console.error('Error creating circular:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update a circular
router.put('/:id', async (req, res) => {
    try {
        const { title, content, target_audience, expiry_date } = req.body;
        await pool.execute(
            'UPDATE circulars SET title = ?, content = ?, target_audience = ?, expiry_date = ? ' +
            'WHERE id = ?',
            [title, content, target_audience, expiry_date, req.params.id]
        );
        res.json({ message: 'Circular updated successfully' });
    } catch (error) {
        console.error('Error updating circular:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete a circular
router.delete('/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM circulars WHERE id = ?', [req.params.id]);
        res.json({ message: 'Circular deleted successfully' });
    } catch (error) {
        console.error('Error deleting circular:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 