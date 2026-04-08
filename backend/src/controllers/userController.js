const userService = require('../services/userService');

const getEmployees = async (req, res, next) => {
  try {
    const employees = await userService.getEmployees(req.user.business_id);
    res.json({ employees });
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.json({ profile });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const profile = await userService.updateProfile(req.user.id, req.body);
    res.json({ profile });
  } catch (err) { next(err); }
};

const toggleActive = async (req, res, next) => {
  try {
    const user = await userService.toggleActive(req.params.id, req.user.business_id, req.body.isActive);
    res.json({ user });
  } catch (err) { next(err); }
};

const getDashboard = async (req, res, next) => {
  try {
    const stats = await userService.getDashboardStats(req.user.business_id);
    res.json({ stats });
  } catch (err) { next(err); }
};

module.exports = { getEmployees, getProfile, updateProfile, toggleActive, getDashboard };
