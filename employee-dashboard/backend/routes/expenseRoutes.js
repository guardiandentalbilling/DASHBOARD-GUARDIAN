const express = require('express');
const router = express.Router();
const {
    getAllExpenses,
    getExpenseById,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpensesByCategory,
    searchExpenses,
    getExpenseStats,
    approveExpense
} = require('../controllers/expenseController');

// @route   GET /api/expenses
// @desc    Get all expenses with optional filtering
// @access  Public
router.get('/', getAllExpenses);

// @route   GET /api/expenses/search
// @desc    Search expenses by description, category, etc.
// @access  Public
router.get('/search', searchExpenses);

// @route   GET /api/expenses/stats
// @desc    Get expense statistics
// @access  Public
router.get('/stats', getExpenseStats);

// @route   GET /api/expenses/category/:category
// @desc    Get expenses by category
// @access  Public
router.get('/category/:category', getExpensesByCategory);

// @route   GET /api/expenses/:id
// @desc    Get single expense by ID
// @access  Public
router.get('/:id', getExpenseById);

// @route   POST /api/expenses
// @desc    Create new expense
// @access  Public
router.post('/', createExpense);

// @route   PUT /api/expenses/:id
// @desc    Update expense
// @access  Public
router.put('/:id', updateExpense);

// @route   PUT /api/expenses/:id/approve
// @desc    Approve expense
// @access  Public
router.put('/:id/approve', approveExpense);

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
// @access  Public
router.delete('/:id', deleteExpense);

module.exports = router;