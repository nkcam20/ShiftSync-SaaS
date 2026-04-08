const express = require('express');
const router = express.Router();
const noticeController = require('../controllers/noticeController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

const noticeSchema = Joi.object({
  title: Joi.string().required(),
  content: Joi.string().required(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  expiresAt: Joi.string().isoDate().optional()
});

router.post('/', authenticate, requireRole('manager'), validate(noticeSchema), noticeController.create);
router.get('/', authenticate, noticeController.list);
router.delete('/:id', authenticate, requireRole('manager'), noticeController.remove);

module.exports = router;
