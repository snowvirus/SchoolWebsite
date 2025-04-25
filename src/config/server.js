const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

module.exports = (app) => {
    // Security middleware
    app.use(helmet());
    app.use(cors());
    app.use(compression());

    // Static file serving
    app.use(express.static(path.join(__dirname, '../public')));
    app.use('/src/auth', express.static(path.join(__dirname, '../auth')));
    app.use('/src/student', express.static(path.join(__dirname, '../student')));
    app.use('/src/admin', express.static(path.join(__dirname, '../admin')));
    app.use('/src/shared', express.static(path.join(__dirname, '../shared')));

    // Body parsing
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Routes
    app.use('/api/auth', require('../routes/auth'));
    app.use('/api/student', require('../routes/student'));
    app.use('/api/admin', require('../routes/admin'));
    app.use('/api/academic', require('../routes/academic'));
    app.use('/api/attendance', require('../routes/attendance'));

    // Error handling
    app.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
            error: 'Something went wrong!',
            message: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    });

    // 404 handler
    app.use((req, res) => {
        res.status(404).json({
            error: 'Not Found',
            message: 'The requested resource was not found'
        });
    });
}; 