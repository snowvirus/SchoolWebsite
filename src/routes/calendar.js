const express = require('express');
const router = express.Router();
const { pool } = require('../database/initDatabase');

// Get all events
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM events ORDER BY start_date ASC'
        );
        res.json(rows);
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Create a new event
router.post('/', async (req, res) => {
    try {
        const { title, description, start_date, end_date, event_type } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO events (title, description, start_date, end_date, event_type, created_by) ' +
            'VALUES (?, ?, ?, ?, ?, ?)',
            [title, description, start_date, end_date, event_type, req.user.id]
        );
        res.status(201).json({ id: result.insertId, message: 'Event created successfully' });
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update an event
router.put('/:id', async (req, res) => {
    try {
        const { title, description, start_date, end_date, event_type } = req.body;
        await pool.execute(
            'UPDATE events SET title = ?, description = ?, start_date = ?, end_date = ?, event_type = ? ' +
            'WHERE id = ?',
            [title, description, start_date, end_date, event_type, req.params.id]
        );
        res.json({ message: 'Event updated successfully' });
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Delete an event
router.delete('/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.json({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router; 