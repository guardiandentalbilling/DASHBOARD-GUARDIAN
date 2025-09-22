const express = require('express');
const router = express.Router();
const {
    getAllClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    getClientsByStatus,
    searchClients,
    getClientStats,
    updateClientBilling
} = require('../controllers/clientController');

// @route   GET /api/clients
// @desc    Get all clients with optional filtering
// @access  Public
router.get('/', getAllClients);

// @route   GET /api/clients/search
// @desc    Search clients by name, contact, email, etc.
// @access  Public
router.get('/search', searchClients);

// @route   GET /api/clients/stats
// @desc    Get client statistics
// @access  Public
router.get('/stats', getClientStats);

// @route   GET /api/clients/status/:status
// @desc    Get clients by status
// @access  Public
router.get('/status/:status', getClientsByStatus);

// @route   GET /api/clients/:id
// @desc    Get single client by ID
// @access  Public
router.get('/:id', getClientById);

// @route   POST /api/clients
// @desc    Create new client
// @access  Public
router.post('/', createClient);

// @route   PUT /api/clients/:id
// @desc    Update client
// @access  Public
router.put('/:id', updateClient);

// @route   PUT /api/clients/:id/billing
// @desc    Update client billing information
// @access  Public
router.put('/:id/billing', updateClientBilling);

// @route   DELETE /api/clients/:id
// @desc    Delete client
// @access  Public
router.delete('/:id', deleteClient);

module.exports = router;