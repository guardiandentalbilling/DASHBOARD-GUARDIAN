const { body, validationResult } = require('express-validator');

// Validation rules for employee registration/update
const validateEmployee = [
    body('firstName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),
    
    body('lastName')
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('phone')
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    
    body('position')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Position must be between 2 and 100 characters'),
    
    body('department')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Department must be between 2 and 100 characters'),
    
    body('salary')
        .isNumeric()
        .isFloat({ min: 0 })
        .withMessage('Salary must be a positive number')
];

// Validation rules for user registration
const validateUserRegistration = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
    
    body('role')
        .isIn(['employee', 'admin'])
        .withMessage('Role must be either employee or admin')
];

// Validation rules for login
const validateLogin = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),
    
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Validation rules for loan request
const validateLoanRequest = [
    body('amount')
        .isNumeric()
        .isFloat({ min: 100, max: 50000 })
        .withMessage('Loan amount must be between $100 and $50,000'),
    
    body('reason')
        .trim()
        .isLength({ min: 10, max: 500 })
        .withMessage('Reason must be between 10 and 500 characters'),
    
    body('monthsToRepay')
        .isInt({ min: 1, max: 60 })
        .withMessage('Repayment period must be between 1 and 60 months')
];

// Validation rules for attendance check-in/out
const validateAttendance = [
    body('employeeId')
        .isMongoId()
        .withMessage('Valid employee ID is required'),
    
    body('checkInTime')
        .optional()
        .isISO8601()
        .withMessage('Check-in time must be a valid date'),
    
    body('checkOutTime')
        .optional()
        .isISO8601()
        .withMessage('Check-out time must be a valid date')
];

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    
    next();
};

module.exports = {
    validateEmployee,
    validateUserRegistration,
    validateLogin,
    validateLoanRequest,
    validateAttendance,
    handleValidationErrors
};