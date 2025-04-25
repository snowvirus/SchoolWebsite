const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// Login route
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        logger.info('Login attempt:', { username });

        const [rows] = await pool.execute(
            'SELECT * FROM admin_users WHERE username = ?',
            [username]
        );

        if (rows.length === 0) {
            logger.warn('User not found:', { username });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            logger.warn('Invalid password for user:', { username });
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logger.info('Login successful:', { username });
        res.json({ token });
    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router; 