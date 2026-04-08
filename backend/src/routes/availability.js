const express = require('express');
const router = express.Router();
const availabilityController = require('../controllers/availabilityController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const availabilitySchema = Joi.object({
  availability: Joi.array().items(Joi.object({
    day_of_week: Joi.number().integer().min(0).max(6).required(),
    start_time: Joi.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).required(),
    end_time: Joi.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/).required(),
    is_available: Joi.boolean().default(true)
  })).required()
});

router.post('/', authenticate, requireRole('employee'), validate(availabilitySchema), availabilityController.set);
router.get('/me', authenticate, requireRole('employee'), availabilityController.getMine);
router.get('/team', authenticate, requireRole('manager'), availabilityController.getTeam);

module.exports = router;
