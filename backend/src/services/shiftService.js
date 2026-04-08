const supabase = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class ShiftService {
  // Create shift
  async create(shiftData, userId, businessId) {
    const { data, error } = await supabase
      .from('shifts')
      .insert({
        ...shiftData,
        business_id: businessId,
        created_by: userId,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create shift: ' + error.message);
    return data;
  }

  // List shifts for business
  async list(businessId, { startDate, endDate, status }) {
    let query = supabase
      .from('shifts')
      .select(`
        *,
        created_by_user:users!shifts_created_by_fkey(full_name),
        assignments:shift_assignments(
          id, status,
          user:users(id, full_name, email)
        )
      `)
      .eq('business_id', businessId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch shifts: ' + error.message);
    return data;
  }

  // Get single shift
  async getById(shiftId, businessId) {
    const { data, error } = await supabase
      .from('shifts')
      .select(`
        *,
        created_by_user:users!shifts_created_by_fkey(full_name),
        assignments:shift_assignments(
          id, status,
          user:users(id, full_name, email)
        )
      `)
      .eq('id', shiftId)
      .eq('business_id', businessId)
      .single();

    if (error || !data) throw new AppError('Shift not found', 404);
    return data;
  }

  // Update shift
  async update(shiftId, businessId, updates) {
    const { data, error } = await supabase
      .from('shifts')
      .update(updates)
      .eq('id', shiftId)
      .eq('business_id', businessId)
      .select()
      .single();

    if (error) throw new AppError('Failed to update shift: ' + error.message);
    return data;
  }

  // Delete shift
  async delete(shiftId, businessId) {
    const { error } = await supabase
      .from('shifts')
      .delete()
      .eq('id', shiftId)
      .eq('business_id', businessId);

    if (error) throw new AppError('Failed to delete shift: ' + error.message);
  }

  // Assign employees to shift
  async assign(shiftId, businessId, userIds, assignedBy) {
    // Verify shift exists
    const { data: shift } = await supabase
      .from('shifts')
      .select('id, required_count')
      .eq('id', shiftId)
      .eq('business_id', businessId)
      .single();

    if (!shift) throw new AppError('Shift not found', 404);

    // Create assignments
    const assignments = userIds.map(userId => ({
      shift_id: shiftId,
      user_id: userId,
      business_id: businessId,
      assigned_by: assignedBy,
      status: 'assigned',
    }));

    const { data, error } = await supabase
      .from('shift_assignments')
      .upsert(assignments, { onConflict: 'shift_id,user_id' })
      .select(`
        id, status,
        user:users(id, full_name, email)
      `);

    if (error) throw new AppError('Failed to assign employees: ' + error.message);
    return data;
  }

  // Unassign employee from shift
  async unassign(shiftId, userId, businessId) {
    const { error } = await supabase
      .from('shift_assignments')
      .delete()
      .eq('shift_id', shiftId)
      .eq('user_id', userId)
      .eq('business_id', businessId);

    if (error) throw new AppError('Failed to unassign employee: ' + error.message);
  }

  // Publish schedule (batch update)
  async publish(businessId, shiftIds) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('shifts')
      .update({ status: 'published', published_at: now })
      .eq('business_id', businessId)
      .in('id', shiftIds)
      .eq('status', 'draft')
      .select();

    if (error) throw new AppError('Failed to publish shifts: ' + error.message);
    return data;
  }

  // Get employee's assigned shifts
  async getMyShifts(userId, businessId, { startDate, endDate }) {
    let query = supabase
      .from('shift_assignments')
      .select(`
        id, status,
        shift:shifts(*)
      `)
      .eq('user_id', userId)
      .eq('business_id', businessId);

    if (startDate || endDate) {
      // Filter by shift date
      query = query.not('shift', 'is', null);
    }

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch shifts: ' + error.message);

    // Filter by date range in JS (since nested filter not supported)
    let filtered = data || [];
    if (startDate) filtered = filtered.filter(a => a.shift && a.shift.date >= startDate);
    if (endDate) filtered = filtered.filter(a => a.shift && a.shift.date <= endDate);

    return filtered;
  }
}

module.exports = new ShiftService();
