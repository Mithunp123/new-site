const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const pool = require('./config/db');

// Map: campaignId -> Set of WebSocket clients
const campaignRooms = new Map();

// Map: ws -> { userId, role, campaignIds }
const clientMeta = new WeakMap();

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

    clientMeta.set(ws, {
      userId: decoded.id,
      role: decoded.role,
      campaignIds: new Set(),
    });

    ws.on('message', async (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      const meta = clientMeta.get(ws);
      if (!meta) return;

      // ── Subscribe to a campaign room (for status updates + chat) ──
      if (msg.type === 'subscribe' && msg.campaign_id) {
        const cid = String(msg.campaign_id);
        if (!campaignRooms.has(cid)) campaignRooms.set(cid, new Set());
        campaignRooms.get(cid).add(ws);
        meta.campaignIds.add(cid);
        ws.send(JSON.stringify({ type: 'subscribed', campaign_id: cid }));
      }

      // ── Unsubscribe ──
      if (msg.type === 'unsubscribe' && msg.campaign_id) {
        const cid = String(msg.campaign_id);
        campaignRooms.get(cid)?.delete(ws);
        meta.campaignIds.delete(cid);
      }

      // ── Chat message ──
      if (msg.type === 'chat' && msg.campaign_id && msg.message?.trim()) {
        const cid = String(msg.campaign_id);
        const senderType = meta.role === 'brand' ? 'brand' : 'creator';

        try {
          // Verify sender belongs to this campaign
          const [camp] = await pool.query(
            'SELECT brand_id, creator_id FROM campaigns WHERE id=?',
            [cid]
          );
          if (!camp.length) return;

          const c = camp[0];
          const allowed =
            (senderType === 'brand' && c.brand_id === meta.userId) ||
            (senderType === 'creator' && c.creator_id === meta.userId);
          if (!allowed) return;

          // Persist to DB
          const [result] = await pool.query(
            'INSERT INTO messages (campaign_id, sender_type, sender_id, message) VALUES (?, ?, ?, ?)',
            [cid, senderType, meta.userId, msg.message.trim()]
          );

          const payload = JSON.stringify({
            type: 'chat',
            campaign_id: cid,
            id: result.insertId,
            sender_type: senderType,
            sender_id: meta.userId,
            message: msg.message.trim(),
            created_at: new Date().toISOString(),
          });

          // Broadcast to everyone in the room (including sender for confirmation)
          const room = campaignRooms.get(cid);
          if (room) {
            room.forEach(client => {
              if (client.readyState === 1) client.send(payload);
            });
          }
        } catch (e) {
          console.error('[WS] Chat error:', e.message);
        }
      }

      // ── Mark messages as read ──
      if (msg.type === 'mark_read' && msg.campaign_id) {
        const cid = String(msg.campaign_id);
        const senderType = meta.role === 'brand' ? 'creator' : 'brand'; // mark OTHER party's messages
        try {
          await pool.query(
            'UPDATE messages SET is_read=true WHERE campaign_id=? AND sender_type=? AND is_read=false',
            [cid, senderType]
          );
        } catch (e) { /* silent */ }
      }
    });

    ws.on('close', () => {
      const meta = clientMeta.get(ws);
      if (meta) {
        meta.campaignIds.forEach(cid => campaignRooms.get(cid)?.delete(ws));
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
  const room = campaignRooms.get(cid);
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

module.exports = { setupWebSocket, broadcastCampaignUpdate };
