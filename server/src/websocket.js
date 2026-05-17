const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const pool = require('./config/db');

// Map: conversationId/campaignId -> Set of WebSocket clients
const rooms = new Map();

// Map: ws -> { userId, role, roomIds }
const clientMeta = new WeakMap();

// Map: userId -> Set of ws connections (for online tracking)
const onlineUsers = new Map();

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const { query } = url.parse(req.url, true);
    const token = query.token;

    if (!token) { ws.close(4001, 'Missing token'); return; }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    const userId = decoded.id;
    const userRole = decoded.role;

    clientMeta.set(ws, {
      userId,
      role: userRole,
      roomIds: new Set(),
    });

    // Track online users
    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(ws);

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      const meta = clientMeta.get(ws);
      if (!meta) return;

      // ── Subscribe to a room (conversation or campaign) ──
      if (msg.type === 'subscribe' && (msg.conversation_id || msg.campaign_id)) {
        const rid = String(msg.conversation_id || msg.campaign_id);
        if (!rooms.has(rid)) rooms.set(rid, new Set());
        rooms.get(rid).add(ws);
        meta.roomIds.add(rid);
        ws.send(JSON.stringify({ type: 'subscribed', room_id: rid }));
      }

      // ── Unsubscribe ──
      if (msg.type === 'unsubscribe' && (msg.conversation_id || msg.campaign_id)) {
        const rid = String(msg.conversation_id || msg.campaign_id);
        rooms.get(rid)?.delete(ws);
        meta.roomIds.delete(rid);
      }

      // ── Chat message (via conversation) ──
      if (msg.type === 'chat' && (msg.conversation_id || msg.campaign_id) && msg.message?.trim()) {
        const rid = String(msg.conversation_id || msg.campaign_id);
        const senderType = meta.role === 'brand' ? 'brand' : 'creator';

        try {
          let convId = null;
          let brandId = null;
          let creatorId = null;

          // Try to find conversation directly
          const [conv] = await pool.query('SELECT * FROM conversations WHERE id = ?', [rid]);
          if (conv.length) {
            convId = conv[0].id;
            brandId = conv[0].brand_id;
            creatorId = conv[0].creator_id;
          } else {
            // Fallback: maybe it's a campaign_id
            const [camp] = await pool.query('SELECT brand_id, creator_id FROM campaigns WHERE id = ?', [rid]);
            if (!camp.length) return;

            brandId = camp[0].brand_id;
            creatorId = camp[0].creator_id;

            // Find or create conversation
            const [existingConv] = await pool.query(
              'SELECT id FROM conversations WHERE brand_id = ? AND creator_id = ?',
              [brandId, creatorId]
            );
            if (existingConv.length) {
              convId = existingConv[0].id;
            } else {
              const [newConv] = await pool.query(
                'INSERT INTO conversations (brand_id, creator_id) VALUES (?, ?)',
                [brandId, creatorId]
              );
              convId = newConv.insertId;
            }
          }

          // Verify sender belongs to this conversation
          const isBrand = senderType === 'brand' && brandId === meta.userId;
          const isCreator = senderType === 'creator' && creatorId === meta.userId;
          if (!isBrand && !isCreator) return;

          // Follow gate
          const [follows] = await pool.query(
            'SELECT id FROM brand_saved_creators WHERE brand_id = ? AND creator_id = ?',
            [brandId, creatorId]
          );
          if (!follows.length) return;

          // Persist to DB
          const [result] = await pool.query(
            'INSERT INTO direct_messages (conversation_id, sender_type, sender_id, message, message_type) VALUES (?, ?, ?, ?, ?)',
            [convId, senderType, meta.userId, msg.message.trim(), msg.message_type || 'text']
          );

          // Update conversation last_message_at
          await pool.query('UPDATE conversations SET last_message_at = NOW() WHERE id = ?', [convId]);

          const payload = JSON.stringify({
            type: 'chat',
            conversation_id: String(convId),
            campaign_id: rid, // Keep for backwards compat
            id: result.insertId,
            sender_type: senderType,
            sender_id: meta.userId,
            message: msg.message.trim(),
            message_type: msg.message_type || 'text',
            created_at: new Date().toISOString(),
          });

          // Broadcast to everyone in the room (including sender for confirmation)
          const room = rooms.get(rid);
          if (room) {
            room.forEach(client => {
              if (client.readyState === 1) client.send(payload);
            });
          }
          // Also broadcast to the conversation room if different from campaign room
          if (String(convId) !== rid) {
            const convRoom = rooms.get(String(convId));
            if (convRoom) {
              convRoom.forEach(client => {
                if (client.readyState === 1) client.send(payload);
              });
            }
          }
        } catch (e) {
          console.error('[WS] Chat error:', e.message);
        }
      }

      // ── Typing indicator ──
      if (msg.type === 'typing' && (msg.conversation_id || msg.campaign_id)) {
        const rid = String(msg.conversation_id || msg.campaign_id);
        const payload = JSON.stringify({
          type: 'typing',
          room_id: rid,
          sender_id: meta.userId,
          sender_type: meta.role === 'brand' ? 'brand' : 'creator',
          is_typing: msg.is_typing !== false,
        });

        const room = rooms.get(rid);
        if (room) {
          room.forEach(client => {
            if (client !== ws && client.readyState === 1) client.send(payload);
          });
        }
      }

      // ── Mark messages as read ──
      if (msg.type === 'mark_read' && (msg.conversation_id || msg.campaign_id)) {
        const rid = String(msg.conversation_id || msg.campaign_id);
        const otherType = meta.role === 'brand' ? 'creator' : 'brand';
        try {
          // Try conversation-based first
          const [conv] = await pool.query('SELECT id FROM conversations WHERE id = ?', [rid]);
          if (conv.length) {
            await pool.query(
              'UPDATE direct_messages SET is_read = true WHERE conversation_id = ? AND sender_type = ? AND is_read = false',
              [rid, otherType]
            );
          } else {
            // Legacy: campaign-based
            await pool.query(
              'UPDATE messages SET is_read = true WHERE campaign_id = ? AND sender_type = ? AND is_read = false',
              [rid, otherType]
            );
          }

          // Notify the room about read receipts
          const payload = JSON.stringify({
            type: 'messages_read',
            room_id: rid,
            read_by: meta.userId,
            read_by_type: meta.role === 'brand' ? 'brand' : 'creator',
          });
          const room = rooms.get(rid);
          if (room) {
            room.forEach(client => {
              if (client !== ws && client.readyState === 1) client.send(payload);
            });
          }
        } catch (e) { /* silent */ }
      }
    });

    ws.on('close', () => {
      const meta = clientMeta.get(ws);
      if (meta) {
        meta.roomIds.forEach(rid => rooms.get(rid)?.delete(ws));
        // Remove from online users
        const userSockets = onlineUsers.get(meta.userId);
        if (userSockets) {
          userSockets.delete(ws);
          if (userSockets.size === 0) onlineUsers.delete(meta.userId);
        }
      }
    });

    ws.on('error', () => ws.terminate());
  });

  return wss;
}

/**
 * Broadcast a campaign status update to all subscribers.
 */
function broadcastCampaignUpdate(campaignId, payload) {
  const cid = String(campaignId);
  const room = rooms.get(cid);
  if (!room || room.size === 0) return;

  const message = JSON.stringify({
    type: 'campaign_update',
    campaign_id: cid,
    ...payload,
  });

  room.forEach(ws => {
    if (ws.readyState === 1) ws.send(message);
  });
}

/**
 * Check if a user is online.
 */
function isUserOnline(userId) {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
}

module.exports = { setupWebSocket, broadcastCampaignUpdate, isUserOnline };
