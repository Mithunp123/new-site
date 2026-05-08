const pool = require('../config/db');
const { success, error } = require('../helpers/response');

/**
 * Get all conversations (campaigns with messages) for the logged-in user.
 * Returns list of campaigns they can chat in, with last message preview.
 */
exports.getConversations = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const userType = role === 'brand' ? 'brand' : 'creator';

    let query;
    if (userType === 'brand') {
      query = `
        SELECT
          c.id AS campaign_id,
          c.title,
          c.status,
          cr.id AS other_user_id,
          cr.name AS other_user_name,
          cr.profile_photo AS other_user_photo,
          'creator' AS other_user_type,
          CASE WHEN bsc.id IS NOT NULL THEN true ELSE false END AS is_saved,
          (SELECT message FROM messages WHERE campaign_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
          (SELECT created_at FROM messages WHERE campaign_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
          (SELECT COUNT(*) FROM messages WHERE campaign_id=c.id AND sender_type='creator' AND is_read=false) AS unread_count
        FROM campaigns c
        JOIN creators cr ON cr.id = c.creator_id
        LEFT JOIN brand_saved_creators bsc ON bsc.creator_id = cr.id AND bsc.brand_id = ?
        WHERE c.brand_id = ?
          AND c.status NOT IN ('request_sent', 'declined')
        ORDER BY last_message_at DESC, c.updated_at DESC
      `;
    } else {
      query = `
        SELECT
          c.id AS campaign_id,
          c.title,
          c.status,
          b.id AS other_user_id,
          b.name AS other_user_name,
          b.logo_url AS other_user_photo,
          'brand' AS other_user_type,
          (SELECT message FROM messages WHERE campaign_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
          (SELECT created_at FROM messages WHERE campaign_id=c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at,
          (SELECT COUNT(*) FROM messages WHERE campaign_id=c.id AND sender_type='brand' AND is_read=false) AS unread_count
        FROM campaigns c
        JOIN brands b ON b.id = c.brand_id
        WHERE c.creator_id = ?
          AND c.status NOT IN ('request_sent', 'declined')
        ORDER BY last_message_at DESC, c.updated_at DESC
      `;
    }

    const params = userType === 'brand' ? [id, id] : [id];
    const [rows] = await pool.query(query, params);
    success(res, rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all messages for a specific campaign.
 * Also marks messages from the other party as read.
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { id, role } = req.user;
    const userType = role === 'brand' ? 'brand' : 'creator';

    // Verify user belongs to this campaign
    const [camp] = await pool.query(
      'SELECT brand_id, creator_id FROM campaigns WHERE id=?',
      [campaignId]
    );
    if (!camp.length) return error(res, 'Campaign not found', 404);

    const c = camp[0];
    const isBrand = userType === 'brand' && c.brand_id === id;
    const isCreator = userType === 'creator' && c.creator_id === id;
    if (!isBrand && !isCreator) return error(res, 'Forbidden', 403);

    // Mark messages from the other party as read
    const otherType = userType === 'brand' ? 'creator' : 'brand';
    await pool.query(
      'UPDATE messages SET is_read=true WHERE campaign_id=? AND sender_type=? AND is_read=false',
      [campaignId, otherType]
    );

    // Fetch all messages
    const [messages] = await pool.query(
      'SELECT * FROM messages WHERE campaign_id=? ORDER BY created_at ASC',
      [campaignId]
    );

    success(res, messages);
  } catch (err) {
    next(err);
  }
};

/**
 * Send a message (REST fallback — WebSocket is primary).
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { campaignId } = req.params;
    const { message } = req.body;
    const { id, role } = req.user;
    const senderType = role === 'brand' ? 'brand' : 'creator';

    if (!message?.trim()) return error(res, 'Message cannot be empty', 400);

    const [camp] = await pool.query(
      'SELECT brand_id, creator_id FROM campaigns WHERE id=?',
      [campaignId]
    );
    if (!camp.length) return error(res, 'Campaign not found', 404);

    const c = camp[0];
    const isBrand = senderType === 'brand' && c.brand_id === id;
    const isCreator = senderType === 'creator' && c.creator_id === id;
    if (!isBrand && !isCreator) return error(res, 'Forbidden', 403);

    // If sender is a brand, ensure they 'follow' (saved) the creator before allowing chat
    if (senderType === 'brand') {
      const [follows] = await pool.query('SELECT id FROM brand_saved_creators WHERE brand_id=? AND creator_id=?', [id, c.creator_id]);
      if (!follows.length) return error(res, 'You must follow the creator to send messages', 403);
    }

    const [result] = await pool.query(
      'INSERT INTO messages (campaign_id, sender_type, sender_id, message) VALUES (?, ?, ?, ?)',
      [campaignId, senderType, id, message.trim()]
    );

    const [newMsg] = await pool.query('SELECT * FROM messages WHERE id=?', [result.insertId]);
    success(res, newMsg[0], 'Message sent');
  } catch (err) {
    next(err);
  }
};

/**
 * Get total unread message count for the logged-in user.
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const userType = role === 'brand' ? 'brand' : 'creator';
    const otherType = userType === 'brand' ? 'creator' : 'brand';
    const joinCol = userType === 'brand' ? 'brand_id' : 'creator_id';

    const [rows] = await pool.query(`
      SELECT COUNT(*) AS unread
      FROM messages m
      JOIN campaigns c ON c.id = m.campaign_id
      WHERE c.${joinCol} = ? AND m.sender_type = ? AND m.is_read = false
    `, [id, otherType]);

    success(res, { unread: rows[0].unread });
  } catch (err) {
    next(err);
  }
};
