const jwt = require('jsonwebtoken');
const { pool } = require('../database/initDatabase');
const logger = require('../utils/logger');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            logger.warn('Access denied. No token provided');
            return res.status(401).json({ error: 'Authentication token required' });
        }

        console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
        console.log('Attempting to verify token:', token);
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded successfully:', decoded);
        
        // Verify user exists and is active
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ? AND status = "active"',
            [decoded.id]
        );
        console.log('Users found:', users.length);

        if (users.length === 0) {
            console.log('Checking admin_users table');
            // Try admin_users table if user not found in users table
            const [admins] = await pool.execute(
                'SELECT * FROM admin_users WHERE id = ?',
                [decoded.id]
            );
            console.log('Admins found:', admins.length);

            if (admins.length === 0) {
                logger.warn('Invalid or expired token');
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            req.user = admins[0];
            return next();
        }

        req.user = users[0];
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            logger.warn('Access denied. Insufficient permissions:', { user: req.user });
            return res.status(403).json({ error: 'Unauthorized access' });
        }
        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRole
}; 