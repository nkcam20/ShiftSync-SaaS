const supabase = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class AvailabilityService {
  // Set or update availability for a day
  async set(userId, businessId, availabilityEntries) {
    // availabilityEntries: [{ day_of_week, start_time, end_time, is_available }]
    const records = availabilityEntries.map(entry => ({
      user_id: userId,
      business_id: businessId,
      day_of_week: entry.day_of_week,
      start_time: entry.start_time,
      end_time: entry.end_time,
      is_available: entry.is_available !== false,
    }));

    const { data, error } = await supabase
      .from('availability')
      .upsert(records, { onConflict: 'user_id,day_of_week' })
      .select();

    if (error) throw new AppError('Failed to set availability: ' + error.message);
    return data;
  }

  // Get own availability
  async getForUser(userId) {
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_week', { ascending: true });

    if (error) throw new AppError('Failed to fetch availability: ' + error.message);
    return data;
  }

  // Get all team availability (manager view)
  async getForBusiness(businessId) {
    const { data, error } = await supabase
      .from('availability')
      .select(`
        *,
        user:users(id, full_name, email)
      `)
      .eq('business_id', businessId)
      .order('day_of_week', { ascending: true });

    if (error) throw new AppError('Failed to fetch availability: ' + error.message);
    return data;
  }
}

module.exports = new AvailabilityService();
