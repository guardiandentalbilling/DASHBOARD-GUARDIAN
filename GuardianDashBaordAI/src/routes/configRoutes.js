const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { getCurrency, setCurrency } = require('../controllers/configController');

const router = express.Router();

router.get('/currency', auth, getCurrency);
router.put('/currency', auth, requireRole('admin'), setCurrency);

module.exports = router;