const noticeService = require('../services/noticeService');

const create = async (req, res, next) => {
  try {
    const notice = await noticeService.create(req.user.business_id, req.user.id, req.body);
    
    const io = req.app.get('io');
    if (io) {
      io.to(`business:${req.user.business_id}`).emit('notice:created', {
        notice,
        createdBy: req.user.full_name,
      });
    }
    
    res.status(201).json({ notice });
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const notices = await noticeService.list(req.user.business_id);
    res.json({ notices });
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    await noticeService.delete(req.params.id, req.user.business_id);
    res.json({ message: 'Notice deleted' });
  } catch (err) { next(err); }
};

module.exports = { create, list, remove };
