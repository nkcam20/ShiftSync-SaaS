const supabase = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class SchedulerService {
  /**
   * Built-in constraint-based scheduling algorithm
   * Input: employee availability, shift requirements
   * Output: optimized schedule assignments
   */
  async generateSchedule(businessId, { startDate, endDate }) {
    // 1. Fetch all shifts in range that need assignments
    const { data: shifts, error: shiftErr } = await supabase
      .from('shifts')
      .select(`
        *,
        assignments:shift_assignments(user_id)
      `)
      .eq('business_id', businessId)
      .gte('date', startDate)
      .lte('date', endDate)
      .in('status', ['draft', 'published']);

    if (shiftErr) throw new AppError('Failed to fetch shifts: ' + shiftErr.message);

    // 2. Fetch all active employees
    const { data: employees, error: empErr } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .eq('business_id', businessId)
      .eq('role', 'employee')
      .eq('is_active', true);

    if (empErr) throw new AppError('Failed to fetch employees: ' + empErr.message);
    if (!employees.length) throw new AppError('No active employees found', 400);

    // 3. Fetch all availability
    const { data: availability, error: availErr } = await supabase
      .from('availability')
      .select('*')
      .eq('business_id', businessId);

    if (availErr) throw new AppError('Failed to fetch availability: ' + availErr.message);

    // 4. Fetch approved leave requests in date range
    const { data: leaves } = await supabase
      .from('leave_requests')
      .select('user_id, start_date, end_date')
      .eq('business_id', businessId)
      .eq('status', 'approved')
      .lte('start_date', endDate)
      .gte('end_date', startDate);

    // Build availability map: userId -> { dayOfWeek -> { start, end, available } }
    const availMap = {};
    for (const a of availability) {
      if (!availMap[a.user_id]) availMap[a.user_id] = {};
      availMap[a.user_id][a.day_of_week] = {
        start: a.start_time,
        end: a.end_time,
        available: a.is_available,
      };
    }

    // Build leave set: userId -> Set of dates on leave
    const leaveMap = {};
    for (const l of (leaves || [])) {
      if (!leaveMap[l.user_id]) leaveMap[l.user_id] = new Set();
      const start = new Date(l.start_date);
      const end = new Date(l.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        leaveMap[l.user_id].add(d.toISOString().split('T')[0]);
      }
    }

    // Track shift count per employee for fairness
    const shiftCount = {};
    employees.forEach(e => { shiftCount[e.id] = 0; });

    // Count existing assignments
    for (const shift of shifts) {
      for (const a of (shift.assignments || [])) {
        if (shiftCount[a.user_id] !== undefined) {
          shiftCount[a.user_id]++;
        }
      }
    }

    const newAssignments = [];
    const unfilledShifts = [];

    // 5. For each shift, find available employees and assign
    for (const shift of shifts) {
      const existingAssigned = new Set((shift.assignments || []).map(a => a.user_id));
      const needed = Math.max(0, (shift.required_count || 1) - existingAssigned.size);

      if (needed === 0) continue;

      const shiftDate = shift.date;
      const dayOfWeek = new Date(shiftDate).getDay();

      // Find eligible employees
      const eligible = employees.filter(emp => {
        // Already assigned
        if (existingAssigned.has(emp.id)) return false;

        // On leave
        if (leaveMap[emp.id]?.has(shiftDate)) return false;

        // Check availability
        const avail = availMap[emp.id]?.[dayOfWeek];
        if (!avail || !avail.available) return false;

        // Check time overlap (employee available window covers shift)
        if (avail.start > shift.start_time || avail.end < shift.end_time) return false;

        return true;
      });

      // Sort by fewest shifts (fairness) then random tiebreak
      eligible.sort((a, b) => {
        const diff = (shiftCount[a.id] || 0) - (shiftCount[b.id] || 0);
        return diff !== 0 ? diff : Math.random() - 0.5;
      });

      const toAssign = eligible.slice(0, needed);

      for (const emp of toAssign) {
        newAssignments.push({
          shift_id: shift.id,
          user_id: emp.id,
          business_id: businessId,
          status: 'assigned',
        });
        shiftCount[emp.id] = (shiftCount[emp.id] || 0) + 1;
      }

      if (toAssign.length < needed) {
        unfilledShifts.push({
          shiftId: shift.id,
          title: shift.title,
          date: shift.date,
          needed: needed - toAssign.length,
        });
      }
    }

    // 6. Save assignments to database
    let savedAssignments = [];
    if (newAssignments.length > 0) {
      const { data, error } = await supabase
        .from('shift_assignments')
        .upsert(newAssignments, { onConflict: 'shift_id,user_id' })
        .select(`
          id, shift_id, user_id, status,
          user:users(full_name, email),
          shift:shifts(title, date, start_time, end_time)
        `);

      if (error) throw new AppError('Failed to save schedule: ' + error.message);
      savedAssignments = data;
    }

    return {
      totalShiftsProcessed: shifts.length,
      newAssignments: savedAssignments.length,
      assignments: savedAssignments,
      unfilledShifts,
      employeeShiftCounts: Object.entries(shiftCount).map(([id, count]) => ({
        userId: id,
        name: employees.find(e => e.id === id)?.full_name,
        shiftsAssigned: count,
      })),
    };
  }
}

module.exports = new SchedulerService();
