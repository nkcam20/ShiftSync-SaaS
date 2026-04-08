const leaveService = require('../services/leaveService');

const create = async (req, res, next) => {
  try {
    const leave = await leaveService.create(req.user.id, req.user.business_id, req.body);
    
    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.user.business_id}`).emit('leave:created', {
        leave,
        requestedBy: req.user.full_name,
      });
    }
    
    res.status(201).json({ leave });
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const userId = req.user.role === 'employee' ? req.user.id : req.query.userId;
    const leaves = await leaveService.list(req.user.business_id, {
      userId,
      status: req.query.status,
    });
    res.json({ leaves });
  } catch (err) { next(err); }
};

const review = async (req, res, next) => {
  try {
    const leave = await leaveService.review(
      req.params.id, req.user.business_id, req.user.id, req.body
    );
    
    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.user.business_id}`).emit('leave:updated', {
        leave,
        reviewedBy: req.user.full_name,
      });
    }
    
    res.json({ leave });
  } catch (err) { next(err); }
};

module.exports = { create, list, review };
