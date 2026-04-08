const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      message: 'Business registered successfully',
      ...result,
    });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    res.json({
      message: 'Login successful',
      ...result,
    });
  } catch (err) { next(err); }
};

const googleLogin = async (req, res, next) => {
  try {
    const result = await authService.googleLogin(req.body);
    res.json({
      message: 'Google login successful',
      ...result,
    });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);
    res.json(result);
  } catch (err) { next(err); }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { next(err); }
};

module.exports = { register, login, googleLogin, refresh, logout };
