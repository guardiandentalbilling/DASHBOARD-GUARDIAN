const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { summary } = require('../controllers/payrollController');

const router = express.Router();

router.get('/summary', auth, requireRole('admin'), summary);

module.exports = router;