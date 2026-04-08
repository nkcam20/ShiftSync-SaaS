const supabase = require('../config/database');
const { AppError } = require('../middleware/errorHandler');

class NoticeService {
  async create(businessId, userId, { title, content, priority, expiresAt }) {
    const { data, error } = await supabase
      .from('notices')
      .insert({
        business_id: businessId,
        title,
        content,
        priority: priority || 'normal',
        created_by: userId,
        expires_at: expiresAt || null,
      })
      .select(`
        *,
        author:users!notices_created_by_fkey(full_name)
      `)
      .single();

    if (error) throw new AppError('Failed to create notice: ' + error.message);
    return data;
  }

  async list(businessId) {
    const { data, error } = await supabase
      .from('notices')
      .select(`
        *,
        author:users!notices_created_by_fkey(full_name)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw new AppError('Failed to fetch notices: ' + error.message);
    return data;
  }

  async delete(noticeId, businessId) {
    const { error } = await supabase
      .from('notices')
      .delete()
      .eq('id', noticeId)
      .eq('business_id', businessId);

    if (error) throw new AppError('Failed to delete notice: ' + error.message);
  }
}

module.exports = new NoticeService();
