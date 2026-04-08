const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

router.get('/employees', authenticate, requireRole('manager'), userController.getEmployees);
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', authenticate, validate(Joi.object({ full_name: Joi.string().optional(), phone: Joi.string().optional() })), userController.updateProfile);
router.put('/:id/active', authenticate, requireRole('manager'), validate(Joi.object({ isActive: Joi.boolean().required() })), userController.toggleActive);
router.get('/dashboard', authenticate, userController.getDashboard);

module.exports = router;
