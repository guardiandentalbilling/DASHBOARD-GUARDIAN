const express = require('express');
const { auth, requireRole } = require('../middleware/auth');
const { start, stop, active, summaryToday } = require('../controllers/timeTrackingController');

const router = express.Router();

router.post('/start', auth, start);
router.post('/stop', auth, stop);
router.get('/active', auth, active);
router.get('/summary/today', auth, requireRole('admin'), summaryToday);

module.exports = router;