const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Get pool from server.js
let pool;
router.use((req, res, next) => {
    pool = req.app.locals.pool;
    next();
});

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

        if (role === 'student') {
            // Check students table first
            console.log('Checking students table...');
            const [students] = await pool.query(
                'SELECT * FROM students WHERE admissionNumber = ?',
                [username]
            );
            console.log('Students query result:', { studentCount: students.length });

            if (students.length === 0) {
                console.log('Student not found in students table');
                return res.status(401).json({ message: 'Invalid admission number' });
            }

            const student = students[0];
            console.log('Found student:', { 
                id: student.id, 
                admissionNumber: student.admissionNumber 
            });

            // For students, use admission number as password
            if (password !== student.admissionNumber) {
                console.log('Invalid student password');
                return res.status(401).json({ message: 'Invalid password' });
            }

            // Generate token
            const token = jwt.sign(
                { 
                    id: student.id, 
                    username: student.admissionNumber,
                    role: 'student'
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: student.id,
                    username: student.admissionNumber,
                    full_name: `${student.firstName} ${student.lastName}`,
                    role: 'student'
                }
            });
        } else {
            // Admin login - check users table
            console.log('Checking users table for admin...');
            const [users] = await pool.execute(
                'SELECT * FROM users WHERE username = ? AND user_type = ?',
                [username, role]
            );
            console.log('Users query result:', { userCount: users.length });

            if (users.length === 0) {
                console.log('Admin not found');
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const user = users[0];
            console.log('Found admin:', { 
                id: user.id, 
                username: user.username, 
                user_type: user.user_type 
            });

            // Verify admin password
            console.log('Verifying admin password...');
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log('Admin password verification result:', isValidPassword);

            if (!isValidPassword) {
                console.log('Invalid admin password');
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            // Generate token
            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username,
                    role: user.user_type 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.user_type
                }
            });
        }
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ message: 'Error during login' });
    }
});

module.exports = router; 