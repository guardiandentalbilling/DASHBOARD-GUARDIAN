const express = require('express');
const router = express.Router();
const {
    getAllRevenue,
    getRevenueById,
    createRevenue,
    updateRevenue,
    deleteRevenue,
    getRevenueBySource,
    searchRevenue,
    getRevenueStats,
    recordPayment
} = require('../controllers/revenueController');

// @route   GET /api/revenue
// @desc    Get all revenue records with optional filtering
// @access  Public
router.get('/', getAllRevenue);

// @route   GET /api/revenue/search
// @desc    Search revenue records by description, client, etc.
// @access  Public
router.get('/search', searchRevenue);

// @route   GET /api/revenue/stats
// @desc    Get revenue statistics
// @access  Public
router.get('/stats', getRevenueStats);

// @route   GET /api/revenue/source/:source
// @desc    Get revenue records by source
// @access  Public
router.get('/source/:source', getRevenueBySource);

// @route   GET /api/revenue/:id
// @desc    Get single revenue record by ID
// @access  Public
router.get('/:id', getRevenueById);

// @route   POST /api/revenue
// @desc    Create new revenue record
// @access  Public
router.post('/', createRevenue);

// @route   PUT /api/revenue/:id
// @desc    Update revenue record
// @access  Public
router.put('/:id', updateRevenue);

// @route   PUT /api/revenue/:id/payment
// @desc    Record payment for revenue
// @access  Public
router.put('/:id/payment', recordPayment);

// @route   DELETE /api/revenue/:id
// @desc    Delete revenue record
// @access  Public
router.delete('/:id', deleteRevenue);

module.exports = router;