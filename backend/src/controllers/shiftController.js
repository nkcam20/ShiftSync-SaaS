const shiftService = require('../services/shiftService');

const create = async (req, res, next) => {
  try {
    const shift = await shiftService.create(req.body, req.user.id, req.user.business_id);
    res.status(201).json({ shift });
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const shifts = await shiftService.list(req.user.business_id, req.query);
    res.json({ shifts });
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const shift = await shiftService.getById(req.params.id, req.user.business_id);
    res.json({ shift });
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const shift = await shiftService.update(req.params.id, req.user.business_id, req.body);
    res.json({ shift });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await shiftService.delete(req.params.id, req.user.business_id);
    res.json({ message: 'Shift deleted' });
  } catch (err) { next(err); }
};

const assign = async (req, res, next) => {
  try {
    const assignments = await shiftService.assign(
      req.params.id, req.user.business_id, req.body.userIds, req.user.id
    );
    res.json({ assignments });
  } catch (err) { next(err); }
};

const unassign = async (req, res, next) => {
  try {
    await shiftService.unassign(req.params.id, req.body.userId, req.user.business_id);
    res.json({ message: 'Employee unassigned' });
  } catch (err) { next(err); }
};

const publish = async (req, res, next) => {
  try {
    const shifts = await shiftService.publish(req.user.business_id, req.body.shiftIds);
    
    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.user.business_id}`).emit('schedule:published', {
        shifts,
        publishedBy: req.user.full_name,
        publishedAt: new Date().toISOString(),
      });
    }
    
    res.json({ message: 'Schedule published', shifts });
  } catch (err) { next(err); }
};

const getMyShifts = async (req, res, next) => {
  try {
    const shifts = await shiftService.getMyShifts(req.user.id, req.user.business_id, req.query);
    res.json({ shifts });
  } catch (err) { next(err); }
};

module.exports = { create, list, getById, update, remove, assign, unassign, publish, getMyShifts };
