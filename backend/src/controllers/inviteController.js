const inviteService = require('../services/inviteService');

const createInvite = async (req, res, next) => {
  try {
    const result = await inviteService.createInvite(
      req.user.id, req.user.business_id, req.body.email
    );
    res.status(201).json({ message: 'Invite sent', ...result });
  } catch (err) { next(err); }
};

const acceptInvite = async (req, res, next) => {
  try {
    const user = await inviteService.acceptInvite(req.body);
    res.status(201).json({ message: 'Account created successfully', user });
  } catch (err) { next(err); }
};

const listInvites = async (req, res, next) => {
  try {
    const invites = await inviteService.listInvites(req.user.business_id);
    res.json({ invites });
  } catch (err) { next(err); }
};

module.exports = { createInvite, acceptInvite, listInvites };
