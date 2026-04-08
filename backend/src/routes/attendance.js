const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const Joi = require('joi');

router.post('/clock-in', authenticate, validate(Joi.object({ shiftId: Joi.string().uuid().optional() })), attendanceController.clockIn);
router.post('/clock-out', authenticate, attendanceController.clockOut);
router.get('/status', authenticate, attendanceController.getStatus);
router.get('/report', authenticate, requireRole('manager'), attendanceController.getReport);
router.get('/export', authenticate, requireRole('manager'), attendanceController.exportCSV);

module.exports = router;
