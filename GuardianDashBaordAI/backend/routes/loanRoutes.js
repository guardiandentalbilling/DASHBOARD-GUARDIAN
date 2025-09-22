const express = require('express');
const router = express.Router();
const {
    createLoanRequest,
    getAllLoanRequests,
    getLoanRequestsByEmployee,
    updateLoanRequestStatus,
    addLoanPayment,
    getLoanStats
} = require('../controllers/loanController');

// @route   GET /api/loan-requests/stats
// @desc    Get loan statistics
// @access  Public
router.get('/stats', getLoanStats);

// @route   GET /api/loan-requests
// @desc    Get all loan requests (for admin)
// @access  Public
router.get('/', getAllLoanRequests);

// @route   GET /api/loan-requests/employee/:employeeId
// @desc    Get loan requests by employee
// @access  Public
router.get('/employee/:employeeId', getLoanRequestsByEmployee);

// @route   POST /api/loan-requests
// @desc    Create new loan request
// @access  Public
router.post('/', createLoanRequest);

// @route   PUT /api/loan-requests/:id/status
// @desc    Update loan request status (admin action)
// @access  Public
router.put('/:id/status', updateLoanRequestStatus);

// @route   POST /api/loan-requests/:id/payment
// @desc    Add payment to loan
// @access  Public
router.post('/:id/payment', addLoanPayment);

module.exports = router;