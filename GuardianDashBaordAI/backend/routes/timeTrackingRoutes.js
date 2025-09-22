const express = require('express');
const router = express.Router();
const { authenticateToken, requireEmployee } = require('../middleware/auth');
const {
  startSession,
  pauseSession,
  resumeSession,
  stopSession,
  listSessions,
  daySummary,
  addActivity
} = require('../controllers/timeTrackingController');

// All require auth (employee or admin)
router.post('/start', authenticateToken, requireEmployee, startSession);
router.post('/pause', authenticateToken, requireEmployee, pauseSession);
router.post('/resume', authenticateToken, requireEmployee, resumeSession);
router.post('/stop', authenticateToken, requireEmployee, stopSession);
router.get('/sessions', authenticateToken, requireEmployee, listSessions);
router.get('/summary/:workDay?', authenticateToken, requireEmployee, daySummary);
router.post('/activity', authenticateToken, requireEmployee, addActivity);

module.exports = router;
