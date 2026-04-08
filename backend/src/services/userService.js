const supabase = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class UserService {
  async getEmployees(businessId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, phone, is_active, created_at')
      .eq('business_id', businessId)
      .order('full_name', { ascending: true });

    if (error) throw new AppError('Failed to fetch employees');
    return data;
  }

  async getProfile(userId) {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role, phone, business_id, is_active, created_at')
      .eq('id', userId)
      .single();

    if (error) throw new AppError('Failed to fetch profile');
    return data;
  }

  async updateProfile(userId, updates) {
    const allowed = ['full_name', 'phone'];
    const filtered = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) filtered[key] = updates[key];
    }

    const { data, error } = await supabase
      .from('users')
      .update(filtered)
      .eq('id', userId)
      .select('id, full_name, email, role, phone')
      .single();

    if (error) throw new AppError('Failed to update profile');
    return data;
  }

  async toggleActive(userId, businessId, isActive) {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: isActive })
      .eq('id', userId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update user status');
    return data;
  }

  async getDashboardStats(businessId) {
    const today = new Date().toISOString().split('T')[0];

    const [employees, todayShifts, pendingLeave, pendingSwaps] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).eq('business_id', businessId).eq('is_active', true),
      supabase.from('shifts').select('id', { count: 'exact' }).eq('business_id', businessId).eq('date', today),
      supabase.from('leave_requests').select('id', { count: 'exact' }).eq('business_id', businessId).eq('status', 'pending'),
      supabase.from('swap_requests').select('id', { count: 'exact' }).eq('business_id', businessId).in('status', ['pending', 'target_accepted']),
    ]);

    // Today's attendance
    const { data: attendance } = await supabase
      .from('attendance')
      .select('id, is_late')
      .eq('business_id', businessId)
      .gte('clock_in', `${today}T00:00:00`)
      .lte('clock_in', `${today}T23:59:59`);

    return {
      totalEmployees: employees.count || 0,
      todayShifts: todayShifts.count || 0,
      pendingLeaveRequests: pendingLeave.count || 0,
      pendingSwapRequests: pendingSwaps.count || 0,
      todayClockedIn: attendance?.length || 0,
      todayLate: attendance?.filter(a => a.is_late)?.length || 0,
    };
  }
}

module.exports = new UserService();
