const express = require('express');
const { body } = require('express-validator');
const { list, create, updateStatus } = require('../controllers/loanController');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, list);
router.post('/', auth, [ body('amount').isFloat({ gt: 0 }), body('reason').notEmpty() ], create);
router.put('/:id', auth, requireRole('admin'), updateStatus);

module.exports = router;