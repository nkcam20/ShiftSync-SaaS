const bcrypt = require('bcryptjs');
const supabase = require('../config/database');
const { generateInviteToken } = require('../utils/tokens');
const { sendInviteEmail } = require('../utils/email');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');

class InviteService {
  // Generate and send invite
  async createInvite(managerId, businessId, email) {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Check for pending invite
    const { data: existingInvite } = await supabase
      .from('invite_tokens')
      .select('id')
      .eq('email', email)
      .eq('business_id', businessId)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (existingInvite) {
      throw new AppError('Pending invite already exists for this email', 409);
    }

    // Get business name
    const { data: business } = await supabase
      .from('businesses')
      .select('name')
      .eq('id', businessId)
      .single();

    // Generate token
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    const { data: invite, error } = await supabase
      .from('invite_tokens')
      .insert({
        business_id: businessId,
        email,
        token,
        invited_by: managerId,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create invite: ' + error.message);

    // Send email
    try {
      await sendInviteEmail(email, token, business?.name || 'Your Team');
    } catch (emailErr) {
      console.error('Failed to send invite email:', emailErr.message);
    }

    return { invite, inviteUrl: `${config.frontend.url}/invite/${token}` };
  }

  // Accept invite and register employee
  async acceptInvite({ token, fullName, password, phone }) {
    // Find valid invite
    const { data: invite, error } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (error || !invite) {
      throw new AppError('Invalid or expired invite', 400);
    }

    if (new Date(invite.expires_at) < new Date()) {
      throw new AppError('Invite has expired', 400);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create employee user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        business_id: invite.business_id,
        email: invite.email,
        password_hash: passwordHash,
        full_name: fullName,
        role: 'employee',
        phone,
      })
      .select('id, email, full_name, role, business_id')
      .single();

    if (userError) throw new AppError('Failed to create account: ' + userError.message);

    // Mark invite as used
    await supabase
      .from('invite_tokens')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', invite.id);

    return user;
  }

  // List invites for a business
  async listInvites(businessId) {
    const { data, error } = await supabase
      .from('invite_tokens')
      .select('*, invited_by_user:users!invite_tokens_invited_by_fkey(full_name)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch invites');
    return data;
  }
}

module.exports = new InviteService();
