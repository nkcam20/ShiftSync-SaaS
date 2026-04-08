const supabase = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class LeaveService {
  // Request leave
  async create(userId, businessId, { startDate, endDate, leaveType, reason }) {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        user_id: userId,
        business_id: businessId,
        start_date: startDate,
        end_date: endDate,
        leave_type: leaveType,
        reason,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create leave request: ' + error.message);
    return data;
  }

  // List leave requests
  async list(businessId, { userId, status }) {
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        user:users(id, full_name, email),
        reviewer:users!leave_requests_reviewed_by_fkey(full_name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch leave requests: ' + error.message);
    return data;
  }

  // Review leave request (approve/deny)
  async review(leaveId, businessId, managerId, { status, reviewNotes }) {
    const { data, error } = await supabase
      .from('leave_requests')
      .update({
        status,
        reviewed_by: managerId,
        review_notes: reviewNotes,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', leaveId)
      .eq('business_id', businessId)
      .select(`
        *,
        user:users(id, full_name, email)
      `)
      .single();

    if (error) throw new AppError('Failed to review leave request: ' + error.message);
    return data;
  }
}

module.exports = new LeaveService();
