const swapService = require('../services/swapService');

const create = async (req, res, next) => {
  try {
    const swap = await swapService.create(req.user.id, req.user.business_id, req.body);
    
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.user.business_id}`).emit('swap:requested', {
        swap,
        requestedBy: req.user.full_name,
      });
    }
    
    res.status(201).json({ swap });
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const userId = req.user.role === 'employee' ? req.user.id : req.query.userId;
    const swaps = await swapService.list(req.user.business_id, {
      userId,
      status: req.query.status,
    });
    res.json({ swaps });
  } catch (err) { next(err); }
};

const targetRespond = async (req, res, next) => {
  try {
    const swap = await swapService.targetRespond(req.params.id, req.user.id, req.body);
    
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.user.business_id}`).emit('swap:updated', { swap });
    }
    
    res.json({ swap });
  } catch (err) { next(err); }
};

const managerReview = async (req, res, next) => {
  try {
    const swap = await swapService.managerReview(
      req.params.id, req.user.business_id, req.user.id, req.body
    );
    
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.user.business_id}`).emit('swap:updated', { swap });
    }
    
    res.json({ swap });
  } catch (err) { next(err); }
};

module.exports = { create, list, targetRespond, managerReview };
