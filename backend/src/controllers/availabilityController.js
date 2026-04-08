const availabilityService = require('../services/availabilityService');

const set = async (req, res, next) => {
  try {
    const data = await availabilityService.set(req.user.id, req.user.business_id, req.body.availability);
    res.json({ availability: data });
  } catch (err) { next(err); }
};

const getMine = async (req, res, next) => {
  try {
    const data = await availabilityService.getForUser(req.user.id);
    res.json({ availability: data });
  } catch (err) { next(err); }
};

const getTeam = async (req, res, next) => {
  try {
    const data = await availabilityService.getForBusiness(req.user.business_id);
    res.json({ availability: data });
  } catch (err) { next(err); }
};

module.exports = { set, getMine, getTeam };
