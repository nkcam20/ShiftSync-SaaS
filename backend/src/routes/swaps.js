const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const swapRequestSchema = Joi.object({
  requesterAssignmentId: Joi.string().uuid().required(),
  targetId: Joi.string().uuid().optional(),
  reason: Joi.string().required()
});

const targetRespondSchema = Joi.object({
  accepted: Joi.boolean().required(),
  targetAssignmentId: Joi.string().uuid().when('accepted', { is: true, then: Joi.required(), otherwise: Joi.optional() })
});

const managerReviewSchema = Joi.object({
  status: Joi.string().valid('approved', 'denied').required(),
  managerNotes: Joi.string().allow('')
});

router.post('/', authenticate, requireRole('employee'), validate(swapRequestSchema), swapController.create);
router.get('/', authenticate, swapController.list);
router.put('/:id/respond', authenticate, requireRole('employee'), validate(targetRespondSchema), swapController.targetRespond);
router.put('/:id/review', authenticate, requireRole('manager'), validate(managerReviewSchema), swapController.managerReview);

module.exports = router;
