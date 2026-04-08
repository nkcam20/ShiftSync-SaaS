const supabase = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class AttendanceService {
  // Clock in
  async clockIn(userId, businessId, shiftId) {
    // Check if already clocked in (no clock out)
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'clocked_in')
      .single();

    if (existing) {
      throw new AppError('Already clocked in. Please clock out first.', 400);
    }

    // Check late status if shift provided
    let isLate = false;
    let lateMinutes = 0;

    if (shiftId) {
      const { data: assignment } = await supabase
        .from('shift_assignments')
        .select('id, shift:shifts(start_time, date)')
        .eq('shift_id', shiftId)
        .eq('user_id', userId)
        .single();

      if (assignment?.shift) {
        const shiftStart = new Date(`${assignment.shift.date}T${assignment.shift.start_time}`);
        const now = new Date();
        const diffMs = now - shiftStart;
        lateMinutes = Math.floor(diffMs / 60000);
        if (lateMinutes > 10) {
          isLate = true;
        } else {
          lateMinutes = 0;
        }
      }
    }

    const { data, error } = await supabase
      .from('attendance')
      .insert({
        user_id: userId,
        business_id: businessId,
        shift_id: shiftId || null,
        clock_in: new Date().toISOString(),
        is_late: isLate,
        late_minutes: lateMinutes,
        status: 'clocked_in',
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to clock in: ' + error.message);
    return data;
  }

  // Clock out
  async clockOut(userId) {
    const { data: record, error: fetchError } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'clocked_in')
      .single();

    if (fetchError || !record) {
      throw new AppError('No active clock-in found', 400);
    }

    const clockOut = new Date();
    const clockIn = new Date(record.clock_in);
    const hoursWorked = ((clockOut - clockIn) / 3600000).toFixed(2);

    const { data, error } = await supabase
      .from('attendance')
      .update({
        clock_out: clockOut.toISOString(),
        hours_worked: parseFloat(hoursWorked),
        status: 'clocked_out',
      })
      .eq('id', record.id)
      .select()
      .single();

    if (error) throw new AppError('Failed to clock out: ' + error.message);
    return data;
  }

  // Get attendance report
  async getReport(businessId, { startDate, endDate, userId }) {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        user:users(id, full_name, email),
        shift:shifts(title, date, start_time, end_time)
      `)
      .eq('business_id', businessId)
      .order('clock_in', { ascending: false });

    if (startDate) query = query.gte('clock_in', `${startDate}T00:00:00`);
    if (endDate) query = query.lte('clock_in', `${endDate}T23:59:59`);
    if (userId) query = query.eq('user_id', userId);

    const { data, error } = await query;
    if (error) throw new AppError('Failed to fetch report: ' + error.message);
    return data;
  }

  // Get current status for user
  async getStatus(userId) {
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'clocked_in')
      .single();

    return data;
  }

  // Generate CSV data
  generateCSV(records) {
    if (!records.length) return 'No data available';

    const headers = [
      'Employee', 'Email', 'Shift', 'Clock In', 'Clock Out',
      'Hours Worked', 'Late', 'Late Minutes', 'Status'
    ];

    const rows = records.map(r => [
      r.user?.full_name || '',
      r.user?.email || '',
      r.shift?.title || 'N/A',
      r.clock_in ? new Date(r.clock_in).toLocaleString('en-IN') : '',
      r.clock_out ? new Date(r.clock_out).toLocaleString('en-IN') : '',
      r.hours_worked || 0,
      r.is_late ? 'Yes' : 'No',
      r.late_minutes || 0,
      r.status,
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
    return csv;
  }
}

module.exports = new AttendanceService();
