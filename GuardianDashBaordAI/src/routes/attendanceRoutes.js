const express = require('express');
const { auth } = require('../middleware/auth');
const { getByDate, checkIn, checkOut } = require('../controllers/attendanceController');

const router = express.Router();

router.get('/date/:date', auth, getByDate);
router.post('/check-in', auth, checkIn);
router.post('/check-out', auth, checkOut);

module.exports = router;