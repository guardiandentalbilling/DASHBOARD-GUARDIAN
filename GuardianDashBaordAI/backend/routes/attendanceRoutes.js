const express = require('express');
const router = express.Router();
const {
    checkIn,
    checkOut,
    getTodayAttendanceStatus,
    getAttendanceHistory,
    getAllAttendance,
    getAttendanceStats
} = require('../controllers/attendanceController');

// @route   GET /api/attendance/stats
// @desc    Get attendance statistics
// @access  Public
router.get('/stats', getAttendanceStats);

// @route   GET /api/attendance/all
// @desc    Get all employees attendance for admin
// @access  Public
router.get('/all', getAllAttendance);

// @route   GET /api/attendance/status/:employeeId
// @desc    Get employee attendance status for today
// @access  Public
router.get('/status/:employeeId', getTodayAttendanceStatus);

// @route   GET /api/attendance/history/:employeeId
// @desc    Get employee attendance history
// @access  Public
router.get('/history/:employeeId', getAttendanceHistory);

// @route   POST /api/attendance/checkin
// @desc    Check in employee
// @access  Public
router.post('/checkin', checkIn);

// @route   PUT /api/attendance/checkout
// @desc    Check out employee
// @access  Public
router.put('/checkout', checkOut);

module.exports = router;