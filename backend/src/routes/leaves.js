const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const leaveRequestSchema = Joi.object({
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required(),
  leaveType: Joi.string().valid('sick', 'vacation', 'personal', 'emergency', 'other').required(),
  reason: Joi.string().required()
});

const reviewLeaveSchema = Joi.object({
  status: Joi.string().valid('approved', 'denied').required(),
  reviewNotes: Joi.string().allow('')
});

router.post('/', authenticate, requireRole('employee'), validate(leaveRequestSchema), leaveController.create);
router.get('/', authenticate, leaveController.list);
router.put('/:id/review', authenticate, requireRole('manager'), validate(reviewLeaveSchema), leaveController.review);

module.exports = router;
