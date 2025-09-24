const express = require('express');
const { body } = require('express-validator');
const { list, getById, create, update, softDelete } = require('../controllers/employeeController');
const { auth, requireRole, requireSelfOrAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, requireRole('admin'), list);
router.get('/:id', auth, requireSelfOrAdmin('id'), getById);
router.post('/', auth, requireRole('admin'), [
  body('firstName').notEmpty(),
  body('lastName').notEmpty(),
  body('email').isEmail(),
  body('username').notEmpty(),
], create);
router.put('/:id', auth, requireRole('admin'), update);
router.delete('/:id', auth, requireRole('admin'), softDelete);

module.exports = router;