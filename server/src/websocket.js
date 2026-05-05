const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');

// Map: campaignId -> Set of WebSocket clients
const campaignRooms = new Map();

// Map: ws -> { userId, role, campaignIds }
const clientMeta = new WeakMap();

function setupWebSocket(server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    // Authenticate via ?token= query param
    const { query } = url.parse(req.url, true);
    const token = query.token;

    if (!token) {
      ws.close(4001, 'Missing token');
      return;
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      ws.close(4001, 'Invalid token');
      return;
    }

    clientMeta.set(ws, { userId: decoded.id, role: decoded.role, campaignIds: new Set() });

    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw); } catch { return; }

      // Client subscribes to a campaign room
      if (msg.type === 'subscribe' && msg.campaign_id) {
        const meta = clientMeta.get(ws);
        if (!meta) return;

        const cid = String(msg.campaign_id);
        if (!campaignRooms.has(cid)) campaignRooms.set(cid, new Set());
        campaignRooms.get(cid).add(ws);
        meta.campaignIds.add(cid);

        ws.send(JSON.stringify({ type: 'subscribed', campaign_id: cid }));
      }

      // Client unsubscribes
      if (msg.type === 'unsubscribe' && msg.campaign_id) {
        const cid = String(msg.campaign_id);
        campaignRooms.get(cid)?.delete(ws);
        clientMeta.get(ws)?.campaignIds.delete(cid);
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
 * Broadcast a campaign status update to all subscribers of that campaign.
 * Call this from controllers after any status change.
 */
function broadcastCampaignUpdate(campaignId, payload) {
  const cid = String(campaignId);
  const room = campaignRooms.get(cid);
  if (!room || room.size === 0) return;

  const message = JSON.stringify({ type: 'campaign_update', campaign_id: cid, ...payload });
  room.forEach(ws => {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(message);
    }
  });
}

module.exports = { setupWebSocket, broadcastCampaignUpdate };
