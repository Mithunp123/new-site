const pool = require('../config/db');
const { success, error } = require('../helpers/response');

/**
 * PUT /api/notifications/read-all
 * Marks all unread notifications for the authenticated user as read.
 */
exports.markAllRead = async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const user_type = req.user.role; // 'brand' | 'creator'

    const [result] = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_type = ? AND user_id = ? AND is_read = false',
      [user_type, user_id]
    );

    success(res, { updated_count: result.affectedRows });
  } catch (err) {
    next(err);
  }
};
