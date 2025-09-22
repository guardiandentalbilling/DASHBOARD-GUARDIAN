const express = require('express');
const router = express.Router();
const {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeesByStatus,
    searchEmployees
} = require('../controllers/employeeController');

// @route   GET /api/employees
// @desc    Get all employees
// @access  Public
router.get('/', getAllEmployees);

// @route   GET /api/employees/search
// @desc    Search employees by name, email, role, or client
// @access  Public
router.get('/search', searchEmployees);

// @route   GET /api/employees/status/:status
// @desc    Get employees by status (Active, On Leave, Resigned)
// @access  Public
router.get('/status/:status', getEmployeesByStatus);

// @route   GET /api/employees/:id
// @desc    Get single employee by ID
// @access  Public
router.get('/:id', getEmployeeById);

// @route   POST /api/employees
// @desc    Create new employee
// @access  Public
router.post('/', createEmployee);

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Public
router.put('/:id', updateEmployee);

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Public
router.delete('/:id', deleteEmployee);

module.exports = router;