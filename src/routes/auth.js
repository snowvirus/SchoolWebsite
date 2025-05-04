const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

// Login route
router.post('/login', async (req, res) => {
    console.log('=== Login Request Received ===');
    console.log('Request body:', req.body);
    
    try {
        const { username, password, role } = req.body;
        console.log('Login attempt for:', { username, role });

        // Validate input
        if (!username || !password || !role) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Get user from database
        console.log('Querying database for user...');
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE username = ? AND user_type = ?',
            [username, role]
        );
        console.log('Database query result:', { userCount: users.length });

        if (users.length === 0) {
            console.log('User not found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const user = users[0];
        console.log('Found user:', { 
            id: user.id, 
            username: user.username, 
            user_type: user.user_type 
        });

        // Verify password
        console.log('Verifying password...');
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Password verification result:', validPassword);

        if (!validPassword) {
            console.log('Invalid password');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        console.log('Generating JWT token...');
        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                role: user.user_type 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log('Token generated successfully');

        // Send response
        console.log('Sending successful response');
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.user_type
            }
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

module.exports = router; 