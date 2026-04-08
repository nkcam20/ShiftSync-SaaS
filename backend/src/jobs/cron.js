const cron = require('node-cron');
const supabase = require('../config/database');
const { sendShiftReminderEmail } = require('../utils/email');

const startCronJobs = () => {
  // Daily shift reminder at 7:00 AM IST
  cron.schedule('0 7 * * *', async () => {
    console.log('[CRON] Running daily shift reminder job...');
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get all assignments for today with user and shift info
      const { data: assignments, error } = await supabase
        .from('shift_assignments')
        .select(`
          user:users(id, full_name, email),
          shift:shifts(title, date, start_time, end_time, status)
        `)
        .eq('status', 'assigned');

      if (error) {
        console.error('[CRON] Failed to fetch assignments:', error.message);
        return;
      }

      // Filter for today's published shifts
      const todayAssignments = (assignments || []).filter(
        a => a.shift?.date === today && a.shift?.status === 'published'
      );

      // Group by user
      const byUser = {};
      for (const a of todayAssignments) {
        if (!a.user?.email) continue;
        if (!byUser[a.user.email]) {
          byUser[a.user.email] = {
            fullName: a.user.full_name,
            email: a.user.email,
            shifts: [],
          };
        }
        byUser[a.user.email].shifts.push(a.shift);
      }

      // Send emails
      let sent = 0;
      for (const userData of Object.values(byUser)) {
        try {
          await sendShiftReminderEmail(userData.email, userData.fullName, userData.shifts);
          sent++;
        } catch (emailErr) {
          console.error(`[CRON] Failed to send reminder to ${userData.email}:`, emailErr.message);
        }
      }

      console.log(`[CRON] Sent ${sent} shift reminder emails`);
    } catch (err) {
      console.error('[CRON] Shift reminder job failed:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // Cleanup expired invite tokens (daily at midnight)
  cron.schedule('0 0 * * *', async () => {
    console.log('[CRON] Cleaning expired invites...');
    try {
      const { error } = await supabase
        .from('invite_tokens')
        .delete()
        .eq('used', false)
        .lt('expires_at', new Date().toISOString());

      if (!error) console.log('[CRON] Expired invites cleaned');
    } catch (err) {
      console.error('[CRON] Invite cleanup failed:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  // Cleanup expired refresh tokens (daily at 1 AM)
  cron.schedule('0 1 * * *', async () => {
    console.log('[CRON] Cleaning expired refresh tokens...');
    try {
      await supabase
        .from('refresh_tokens')
        .delete()
        .lt('expires_at', new Date().toISOString());
      
      console.log('[CRON] Expired refresh tokens cleaned');
    } catch (err) {
      console.error('[CRON] Token cleanup failed:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  console.log('[CRON] All cron jobs scheduled (IST)');
};

module.exports = { startCronJobs };
