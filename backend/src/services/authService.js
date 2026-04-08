const bcrypt = require('bcryptjs');
const supabase = require('../config/database');
const { generateAccessToken, generateRefreshToken, generateInviteToken } = require('../utils/tokens');
const { AppError } = require('../middleware/errorHandler');
const config = require('../config');

class AuthService {
  // Register a new business + manager
  async register({ businessName, industry, email, password, fullName, phone }) {
    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Create business
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .insert({ name: businessName, industry })
      .select()
      .single();

    if (bizError) throw new AppError('Failed to create business: ' + bizError.message);

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create manager user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        business_id: business.id,
        email,
        password_hash: passwordHash,
        full_name: fullName,
        role: 'manager',
        phone,
      })
      .select('id, email, full_name, role, business_id')
      .single();

    if (userError) {
      // Rollback business
      await supabase.from('businesses').delete().eq('id', business.id);
      throw new AppError('Failed to create user: ' + userError.message);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + config.jwt.refreshExpiryMs).toISOString(),
    });

    return { user, business, accessToken, refreshToken };
  }

  // Login
  async login({ email, password }) {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, business_id, password_hash, is_active')
      .eq('email', email)
      .single();

    if (error || !user) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.is_active) {
      throw new AppError('Account deactivated', 403);
    }

    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Get business
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', user.business_id)
      .single();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Store refresh token (delete old ones for this user first)
    await supabase.from('refresh_tokens').delete().eq('user_id', user.id);
    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + config.jwt.refreshExpiryMs).toISOString(),
    });

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, business, accessToken, refreshToken };
  }

  // Google Login
  async googleLogin({ token }) {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    
    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, business_id, is_active')
      .eq('email', payload.email)
      .single();

    if (error || !user) {
      throw new AppError('No account found with this email. Please register or get invited first.', 404);
    }

    if (!user.is_active) {
      throw new AppError('Account deactivated', 403);
    }

    // Get business
    const { data: business } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('id', user.business_id)
      .single();

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Store refresh token
    await supabase.from('refresh_tokens').delete().eq('user_id', user.id);
    await supabase.from('refresh_tokens').insert({
      user_id: user.id,
      token: refreshToken,
      expires_at: new Date(Date.now() + config.jwt.refreshExpiryMs).toISOString(),
    });

    return { user, business, accessToken, refreshToken };
  }

  // Refresh token
  async refresh(refreshToken) {
    if (!refreshToken) throw new AppError('Refresh token required', 400);

    const { data: tokenRecord, error } = await supabase
      .from('refresh_tokens')
      .select('*, user:users(id, email, full_name, role, business_id, is_active)')
      .eq('token', refreshToken)
      .single();

    if (error || !tokenRecord) {
      throw new AppError('Invalid refresh token', 401);
    }

    if (new Date(tokenRecord.expires_at) < new Date()) {
      await supabase.from('refresh_tokens').delete().eq('id', tokenRecord.id);
      throw new AppError('Refresh token expired', 401);
    }

    if (!tokenRecord.user.is_active) {
      throw new AppError('Account deactivated', 403);
    }

    // Rotate tokens
    const newAccessToken = generateAccessToken(tokenRecord.user);
    const newRefreshToken = generateRefreshToken();

    await supabase.from('refresh_tokens').delete().eq('id', tokenRecord.id);
    await supabase.from('refresh_tokens').insert({
      user_id: tokenRecord.user.id,
      token: newRefreshToken,
      expires_at: new Date(Date.now() + config.jwt.refreshExpiryMs).toISOString(),
    });

    return { user: tokenRecord.user, accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  // Logout
  async logout(userId) {
    await supabase.from('refresh_tokens').delete().eq('user_id', userId);
  }
}

module.exports = new AuthService();
