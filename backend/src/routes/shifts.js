const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const createShiftSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  date: Joi.string().isoDate().required(),
  start_time: Joi.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).required(),
  end_time: Joi.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).required(),
  required_count: Joi.number().integer().min(1).default(1),
  role_required: Joi.string().allow('')
});

const assignSchema = Joi.object({
  userIds: Joi.array().items(Joi.string().uuid()).required()
});

const publishSchema = Joi.object({
  shiftIds: Joi.array().items(Joi.string().uuid()).required()
});

router.post('/', authenticate, requireRole('manager'), validate(createShiftSchema), shiftController.create);
router.get('/', authenticate, shiftController.list);
router.get('/my', authenticate, shiftController.getMyShifts);
router.get('/:id', authenticate, shiftController.getById);
router.put('/:id', authenticate, requireRole('manager'), validate(createShiftSchema.fork(['title', 'date', 'start_time', 'end_time'], (schema) => schema.optional())), shiftController.update);
router.delete('/:id', authenticate, requireRole('manager'), shiftController.remove);

router.post('/:id/assign', authenticate, requireRole('manager'), validate(assignSchema), shiftController.assign);
router.post('/:id/unassign', authenticate, requireRole('manager'), validate(Joi.object({ userId: Joi.string().uuid().required() })), shiftController.unassign);
router.post('/publish', authenticate, requireRole('manager'), validate(publishSchema), shiftController.publish);

module.exports = router;
