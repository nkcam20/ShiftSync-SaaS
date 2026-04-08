const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const createInviteSchema = Joi.object({
  email: Joi.string().email().required()
});

const acceptInviteSchema = Joi.object({
  token: Joi.string().required(),
  fullName: Joi.string().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().optional()
});

router.post('/', authenticate, requireRole('manager'), validate(createInviteSchema), inviteController.createInvite);
router.get('/', authenticate, requireRole('manager'), inviteController.listInvites);
router.post('/accept', validate(acceptInviteSchema), inviteController.acceptInvite);

module.exports = router;
