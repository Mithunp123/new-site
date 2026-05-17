const pool = require('../config/db');
const { success, error } = require('../helpers/response');

/**
 * Ensure a conversation row exists for a brand-creator pair.
 * Returns the conversation id.
 */
async function ensureConversation(brandId, creatorId) {
  // Try to find existing conversation
  const [existing] = await pool.query(
    'SELECT id FROM conversations WHERE brand_id = ? AND creator_id = ?',
    [brandId, creatorId]
  );
  if (existing.length) return existing[0].id;

  // Create new conversation
  const [result] = await pool.query(
    'INSERT INTO conversations (brand_id, creator_id) VALUES (?, ?)',
    [brandId, creatorId]
  );
  return result.insertId;
}

/**
 * Get all conversations for the logged-in user.
 *
 * FOLLOW GATE:
 * - Brand sees all creators they follow (saved).
 * - Creator sees all brands that follow them.
 * - Messages work via the conversations table, not tied to campaigns.
 */
exports.getConversations = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const userType = role === 'brand' ? 'brand' : 'creator';

    let rows;

    if (userType === 'brand') {
      // Brand sees all creators they follow
      [rows] = await pool.query(`
        SELECT
          bsc.creator_id AS other_user_id,
          cr.name AS other_user_name,
          cr.profile_photo AS other_user_photo,
          'creator' AS other_user_type,
          true AS is_following,
          COALESCE(conv.id, 0) AS conversation_id,
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
          (SELECT dm.message FROM direct_messages dm
           WHERE dm.conversation_id = conv.id
           ORDER BY dm.created_at DESC LIMIT 1) AS last_message,
          (SELECT dm.created_at FROM direct_messages dm
           WHERE dm.conversation_id = conv.id
           ORDER BY dm.created_at DESC LIMIT 1) AS last_message_at,
          (SELECT COUNT(*) FROM direct_messages dm
           WHERE dm.conversation_id = conv.id
           AND dm.sender_type = 'creator' AND dm.is_read = false) AS unread_count
        FROM brand_saved_creators bsc
        JOIN creators cr ON cr.id = bsc.creator_id
        LEFT JOIN conversations conv ON conv.brand_id = bsc.brand_id AND conv.creator_id = bsc.creator_id
        WHERE bsc.brand_id = ?
        ORDER BY last_message_at DESC, bsc.saved_at DESC
      `, [id, id, id]);
    } else {
      // Creator sees all brands that follow them
      [rows] = await pool.query(`
        SELECT
          bsc.brand_id AS other_user_id,
          b.name AS other_user_name,
          b.logo_url AS other_user_photo,
          'brand' AS other_user_type,
          true AS is_following,
          COALESCE(conv.id, 0) AS conversation_id,
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
          (SELECT dm.message FROM direct_messages dm
           WHERE dm.conversation_id = conv.id
           ORDER BY dm.created_at DESC LIMIT 1) AS last_message,
          (SELECT dm.created_at FROM direct_messages dm
           WHERE dm.conversation_id = conv.id
           ORDER BY dm.created_at DESC LIMIT 1) AS last_message_at,
          (SELECT COUNT(*) FROM direct_messages dm
           WHERE dm.conversation_id = conv.id
           AND dm.sender_type = 'brand' AND dm.is_read = false) AS unread_count
        FROM brand_saved_creators bsc
        JOIN brands b ON b.id = bsc.brand_id
        LEFT JOIN conversations conv ON conv.brand_id = bsc.brand_id AND conv.creator_id = bsc.creator_id
        WHERE bsc.creator_id = ?
        ORDER BY last_message_at DESC, bsc.saved_at DESC
      `, [id, id, id]);
    }

    // For conversations that don't exist yet, create them on-the-fly
    for (const row of rows) {
      if (!row.conversation_id || row.conversation_id === 0) {
        const brandId = userType === 'brand' ? id : row.other_user_id;
        const creatorId = userType === 'brand' ? row.other_user_id : id;
        row.conversation_id = await ensureConversation(brandId, creatorId);
      }
    }

    success(res, rows);
  } catch (err) {
    next(err);
  }
};

/**
 * Get all messages for a specific conversation.
 * Supports both conversation_id and legacy campaign_id.
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { id, role } = req.user;
    const userType = role === 'brand' ? 'brand' : 'creator';

    // First try: is this a conversation_id?
    let [conv] = await pool.query('SELECT * FROM conversations WHERE id = ?', [conversationId]);
    
    if (!conv.length) {
      // Fallback: maybe this is a campaign_id — find or create the conversation
      const [camp] = await pool.query('SELECT brand_id, creator_id FROM campaigns WHERE id = ?', [conversationId]);
      if (camp.length) {
        const convId = await ensureConversation(camp[0].brand_id, camp[0].creator_id);
        [conv] = await pool.query('SELECT * FROM conversations WHERE id = ?', [convId]);
        
        // Also migrate any old messages from the messages table to direct_messages
        await migrateOldMessages(conversationId, convId);
      }
    }

    if (!conv.length) return error(res, 'Conversation not found', 404);

    const c = conv[0];
    const isBrand = userType === 'brand' && c.brand_id === id;
    const isCreator = userType === 'creator' && c.creator_id === id;
    if (!isBrand && !isCreator) return error(res, 'Forbidden', 403);

    // Verify follow relationship
    const [follows] = await pool.query(
      'SELECT id FROM brand_saved_creators WHERE brand_id = ? AND creator_id = ?',
      [c.brand_id, c.creator_id]
    );
    if (!follows.length) return error(res, 'Follow relationship required for messaging', 403);

    // Mark messages from the other party as read
    const otherType = userType === 'brand' ? 'creator' : 'brand';
    await pool.query(
      'UPDATE direct_messages SET is_read = true WHERE conversation_id = ? AND sender_type = ? AND is_read = false',
      [c.id, otherType]
    );

    // Fetch all messages
    const [messages] = await pool.query(
      'SELECT * FROM direct_messages WHERE conversation_id = ? ORDER BY created_at ASC',
      [c.id]
    );

    success(res, messages);
  } catch (err) {
    next(err);
  }
};

/**
 * Send a message via REST (fallback when WebSocket not connected).
 */
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { message, message_type, file_url } = req.body;
    const { id, role } = req.user;
    const senderType = role === 'brand' ? 'brand' : 'creator';

    if (!message?.trim() && !file_url) return error(res, 'Message cannot be empty', 400);

    // Find or create conversation
    let [conv] = await pool.query('SELECT * FROM conversations WHERE id = ?', [conversationId]);
    
    if (!conv.length) {
      // Fallback: campaign_id
      const [camp] = await pool.query('SELECT brand_id, creator_id FROM campaigns WHERE id = ?', [conversationId]);
      if (camp.length) {
        const convId = await ensureConversation(camp[0].brand_id, camp[0].creator_id);
        [conv] = await pool.query('SELECT * FROM conversations WHERE id = ?', [convId]);
      }
    }

    if (!conv.length) return error(res, 'Conversation not found', 404);

    const c = conv[0];
    const isBrand = senderType === 'brand' && c.brand_id === id;
    const isCreator = senderType === 'creator' && c.creator_id === id;
    if (!isBrand && !isCreator) return error(res, 'Forbidden', 403);

    // Verify follow relationship
    const [follows] = await pool.query(
      'SELECT id FROM brand_saved_creators WHERE brand_id = ? AND creator_id = ?',
      [c.brand_id, c.creator_id]
    );
    if (!follows.length) return error(res, 'Follow relationship required for messaging', 403);

    const [result] = await pool.query(
      'INSERT INTO direct_messages (conversation_id, sender_type, sender_id, message, message_type, file_url) VALUES (?, ?, ?, ?, ?, ?)',
      [c.id, senderType, id, (message || '').trim(), message_type || 'text', file_url || null]
    );

    // Update conversation last_message_at
    await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [c.id]);

    const [newMsg] = await pool.query('SELECT * FROM direct_messages WHERE id = ?', [result.insertId]);
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
      FROM direct_messages dm
      JOIN conversations conv ON conv.id = dm.conversation_id
      WHERE conv.${joinCol} = ? AND dm.sender_type = ? AND dm.is_read = false
    `, [id, otherType]);

    success(res, { unread: rows[0].unread });
  } catch (err) {
    next(err);
  }
};

/**
 * Get or create a conversation for a specific brand-creator pair.
 * Used when navigating to chat from the Discover page.
 */
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const { id, role } = req.user;
    const { other_user_id } = req.body;

    if (!other_user_id) return error(res, 'other_user_id is required', 400);

    const brandId = role === 'brand' ? id : other_user_id;
    const creatorId = role === 'brand' ? other_user_id : id;

    // Verify follow relationship
    const [follows] = await pool.query(
      'SELECT id FROM brand_saved_creators WHERE brand_id = ? AND creator_id = ?',
      [brandId, creatorId]
    );
    if (!follows.length) return error(res, 'Follow relationship required', 403);

    const conversationId = await ensureConversation(brandId, creatorId);
    success(res, { conversation_id: conversationId });
  } catch (err) {
    next(err);
  }
};

/**
 * Migrate old messages from the campaign-based messages table to direct_messages.
 * Called once per campaign-conversation pair.
 */
async function migrateOldMessages(campaignId, conversationId) {
  try {
    // Check if already migrated
    const [existing] = await pool.query(
      'SELECT id FROM direct_messages WHERE conversation_id = ? LIMIT 1',
      [conversationId]
    );
    if (existing.length) return; // Already has messages, skip

    const [oldMsgs] = await pool.query(
      'SELECT * FROM messages WHERE campaign_id = ? ORDER BY created_at ASC',
      [campaignId]
    );

    for (const msg of oldMsgs) {
      await pool.query(
        'INSERT INTO direct_messages (conversation_id, sender_type, sender_id, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [conversationId, msg.sender_type, msg.sender_id, msg.message, msg.is_read, msg.created_at]
      );
    }
  } catch (e) {
    console.error('[Chat] Migration error:', e.message);
  }
}

module.exports = {
  ...exports,
  ensureConversation,
};
