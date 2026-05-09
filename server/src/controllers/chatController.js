const pool = require('../config/db');
const { success, error } = require('../helpers/response');

/**
 * Get all conversations for the logged-in user.
 *
 * NEW FOLLOW GATE:
 * - Brand sees conversations with all creators they follow (saved), regardless of campaign status.
 * - Creator sees conversations with all brands that follow them (have saved them).
 * - No campaign required to start a conversation — just a follow relationship.
 *
 * A "conversation" is identified by the brand-creator pair. If a campaign exists,
 * we use the most recent active campaign_id as the thread identifier. If no campaign
 * exists yet, we use a virtual conversation keyed by the follow relationship.
 */
exports.getConversations = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const userType = role === 'brand' ? 'brand' : 'creator';

    let rows;

    if (userType === 'brand') {
      // Brand sees all creators they follow, with last message from any campaign thread
      [rows] = await pool.query(`
        SELECT
          bsc.creator_id AS other_user_id,
          cr.name AS other_user_name,
          cr.profile_photo AS other_user_photo,
          'creator' AS other_user_type,
          true AS is_following,
          COALESCE(
            (SELECT c.id FROM campaigns c WHERE c.brand_id = ? AND c.creator_id = bsc.creator_id
             ORDER BY c.created_at DESC LIMIT 1),
            NULL
          ) AS campaign_id,
          COALESCE(
            (SELECT c.title FROM campaigns c WHERE c.brand_id = ? AND c.creator_id = bsc.creator_id
             ORDER BY c.created_at DESC LIMIT 1),
            CONCAT('Chat with ', cr.name)
          ) AS title,
          (SELECT m.message FROM messages m
           JOIN campaigns c ON c.id = m.campaign_id
           WHERE c.brand_id = ? AND c.creator_id = bsc.creator_id
           ORDER BY m.created_at DESC LIMIT 1) AS last_message,
          (SELECT m.created_at FROM messages m
           JOIN campaigns c ON c.id = m.campaign_id
           WHERE c.brand_id = ? AND c.creator_id = bsc.creator_id
           ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
          (SELECT COUNT(*) FROM messages m
           JOIN campaigns c ON c.id = m.campaign_id
           WHERE c.brand_id = ? AND c.creator_id = bsc.creator_id
           AND m.sender_type = 'creator' AND m.is_read = false) AS unread_count
        FROM brand_saved_creators bsc
        JOIN creators cr ON cr.id = bsc.creator_id
        WHERE bsc.brand_id = ?
        ORDER BY last_message_at DESC, bsc.saved_at DESC
      `, [id, id, id, id, id, id]);
    } else {
      // Creator sees all brands that follow them (have saved them)
      [rows] = await pool.query(`
        SELECT
          bsc.brand_id AS other_user_id,
          b.name AS other_user_name,
          b.logo_url AS other_user_photo,
          'brand' AS other_user_type,
          true AS is_following,
          COALESCE(
            (SELECT c.id FROM campaigns c WHERE c.brand_id = bsc.brand_id AND c.creator_id = ?
             ORDER BY c.created_at DESC LIMIT 1),
            NULL
          ) AS campaign_id,
          COALESCE(
            (SELECT c.title FROM campaigns c WHERE c.brand_id = bsc.brand_id AND c.creator_id = ?
             ORDER BY c.created_at DESC LIMIT 1),
            CONCAT('Chat with ', b.name)
          ) AS title,
          (SELECT m.message FROM messages m
           JOIN campaigns c ON c.id = m.campaign_id
           WHERE c.brand_id = bsc.brand_id AND c.creator_id = ?
           ORDER BY m.created_at DESC LIMIT 1) AS last_message,
          (SELECT m.created_at FROM messages m
           JOIN campaigns c ON c.id = m.campaign_id
           WHERE c.brand_id = bsc.brand_id AND c.creator_id = ?
           ORDER BY m.created_at DESC LIMIT 1) AS last_message_at,
          (SELECT COUNT(*) FROM messages m
           JOIN campaigns c ON c.id = m.campaign_id
           WHERE c.brand_id = bsc.brand_id AND c.creator_id = ?
           AND m.sender_type = 'brand' AND m.is_read = false) AS unread_count
        FROM brand_saved_creators bsc
        JOIN brands b ON b.id = bsc.brand_id
        WHERE bsc.creator_id = ?
        ORDER BY last_message_at DESC, bsc.saved_at DESC
      `, [id, id, id, id, id, id]);
    }

    success(res, rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all messages for a specific campaign thread.
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

    // Verify follow relationship
    if (isBrand) {
      const [follows] = await pool.query(
        'SELECT id FROM brand_saved_creators WHERE brand_id=? AND creator_id=?',
        [id, c.creator_id]
      );
      if (!follows.length) return error(res, 'You must follow this creator to view messages', 403);
    } else {
      // Creator: verify the brand follows them
      const [follows] = await pool.query(
        'SELECT id FROM brand_saved_creators WHERE brand_id=? AND creator_id=?',
        [c.brand_id, id]
      );
      if (!follows.length) return error(res, 'The brand must follow you to exchange messages', 403);
    }

    // Mark messages from the other party as read
    const otherType = userType === 'brand' ? 'creator' : 'brand';
    await pool.query(
      'UPDATE messages SET is_read=true WHERE campaign_id=? AND sender_type=? AND is_read=false',
      [campaignId, otherType]
    );

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
 *
 * Gate: brand must follow (save) the creator. Creator can reply if brand follows them.
 * No campaign required — but if no campaign exists, we create a placeholder thread.
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

    // Follow gate: brand must follow creator
    if (isBrand) {
      const [follows] = await pool.query(
        'SELECT id FROM brand_saved_creators WHERE brand_id=? AND creator_id=?',
        [id, c.creator_id]
      );
      if (!follows.length) return error(res, 'You must follow this creator to send messages', 403);
    } else {
      // Creator: brand must follow them
      const [follows] = await pool.query(
        'SELECT id FROM brand_saved_creators WHERE brand_id=? AND creator_id=?',
        [c.brand_id, id]
      );
      if (!follows.length) return error(res, 'The brand must follow you to exchange messages', 403);
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
