const express = require('express');
const router = express.Router();
const schedulerController = require('../controllers/schedulerController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const generateSchema = Joi.object({
  startDate: Joi.string().isoDate().required(),
  endDate: Joi.string().isoDate().required()
});

router.post('/generate', authenticate, requireRole('manager'), validate(generateSchema), schedulerController.generate);

module.exports = router;
