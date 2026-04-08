const schedulerService = require('../services/schedulerService');

const generate = async (req, res, next) => {
  try {
    const result = await schedulerService.generateSchedule(req.user.business_id, req.body);
    res.json({ message: 'Schedule generated', ...result });
  } catch (err) { next(err); }
};

module.exports = { generate };
