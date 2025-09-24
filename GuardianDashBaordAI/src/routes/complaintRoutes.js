const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { list, create } = require('../controllers/complaintController');

const router = express.Router();

router.get('/', auth, requireRole('admin'), list);
router.post('/', auth, create);

module.exports = router;