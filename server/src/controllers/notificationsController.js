import pool from '../config/db.js';

export async function getNotifications(req, res) {
  try {
    const creatorId = req.user.id;
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE creator_id=? ORDER BY created_at DESC', [creatorId]);
    const [unread] = await pool.execute(
      'SELECT COUNT(*) as c FROM notifications WHERE creator_id=? AND is_read=false', [creatorId]);
    res.json({ notifications, unread_count: Number(unread[0].c) });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}

export async function markAsRead(req, res) {
  try {
    await pool.execute('UPDATE notifications SET is_read=true WHERE id=? AND creator_id=?', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}
