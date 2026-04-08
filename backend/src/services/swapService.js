const supabase = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class SwapService {
  // Request swap
  async create(requesterId, businessId, { requesterAssignmentId, targetId, reason }) {
    // Verify requester owns the assignment
    const { data: assignment } = await supabase
      .from('shift_assignments')
      .select('id, shift_id, user_id')
      .eq('id', requesterAssignmentId)
      .eq('user_id', requesterId)
      .single();

    if (!assignment) {
      throw new AppError('Assignment not found or not yours', 404);
    }

    const { data, error } = await supabase
      .from('swap_requests')
      .insert({
        business_id: businessId,
        requester_id: requesterId,
        target_id: targetId || null,
        requester_assignment_id: requesterAssignmentId,
        reason,
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create swap request: ' + error.message);
    return data;
  }

  // List swap requests
  async list(businessId, { userId, status }) {
    let query = supabase
      .from('swap_requests')
      .select(`
        *,
        requester:users!swap_requests_requester_id_fkey(id, full_name, email),
        target:users!swap_requests_target_id_fkey(id, full_name, email),
        requester_assignment:shift_assignments!swap_requests_requester_assignment_id_fkey(
          id,
          shift:shifts(id, title, date, start_time, end_time)
        ),
        reviewer:users!swap_requests_reviewed_by_fkey(full_name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.or(`requester_id.eq.${userId},target_id.eq.${userId}`);
    }
    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch swap requests: ' + error.message);
    return data;
  }

  // Target accepts/declines swap
  async targetRespond(swapId, targetId, { accepted, targetAssignmentId }) {
    if (!accepted) {
      const { data, error } = await supabase
        .from('swap_requests')
        .update({ status: 'denied' })
        .eq('id', swapId)
        .eq('target_id', targetId)
        .select()
        .single();
      if (error) throw new AppError('Failed to respond to swap');
      return data;
    }

    const { data, error } = await supabase
      .from('swap_requests')
      .update({
        status: 'target_accepted',
        target_assignment_id: targetAssignmentId,
      })
      .eq('id', swapId)
      .eq('target_id', targetId)
      .select()
      .single();

    if (error) throw new AppError('Failed to respond to swap');
    return data;
  }

  // Manager approves/denies swap
  async managerReview(swapId, businessId, managerId, { status, managerNotes }) {
    const { data: swap, error: fetchErr } = await supabase
      .from('swap_requests')
      .select('*, requester_assignment:shift_assignments!swap_requests_requester_assignment_id_fkey(shift_id, user_id), target_assignment:shift_assignments!swap_requests_target_assignment_id_fkey(shift_id, user_id)')
      .eq('id', swapId)
      .eq('business_id', businessId)
      .single();

    if (fetchErr || !swap) throw new AppError('Swap request not found', 404);

    if (status === 'approved' && swap.target_assignment) {
      // Perform the actual swap in shift_assignments
      const reqAssign = swap.requester_assignment;
      const tgtAssign = swap.target_assignment;

      // Swap user_ids
      await supabase
        .from('shift_assignments')
        .update({ user_id: tgtAssign.user_id })
        .eq('id', swap.requester_assignment_id);

      await supabase
        .from('shift_assignments')
        .update({ user_id: reqAssign.user_id })
        .eq('id', swap.target_assignment_id);
    }

    const { data, error } = await supabase
      .from('swap_requests')
      .update({
        status,
        manager_notes: managerNotes,
        reviewed_by: managerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', swapId)
      .select()
      .single();

    if (error) throw new AppError('Failed to review swap request');
    return data;
  }
}

module.exports = new SwapService();
