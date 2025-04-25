const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const studentRoutes = require('./student');
const academicRoutes = require('./academic');
const attendanceRoutes = require('./attendance');
const calendarRoutes = require('./calendar');
const circularRoutes = require('./circular');

// Mount routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/student', studentRoutes);
router.use('/academic', academicRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/calendar', calendarRoutes);
router.use('/circular', circularRoutes);

module.exports = router; 