const pool = require('../config/db');
const { success, error } = require('../helpers/response');
const { broadcastCampaignUpdate } = require('../websocket');

exports.acceptCampaign = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [camp] = await pool.query('SELECT creator_id, status FROM campaigns WHERE id = ?', [id]);
    if (!camp.length) return error(res, 'Campaign not found', 404);
    if (camp[0].creator_id !== req.user.id) return error(res, 'Forbidden', 403);
    if (camp[0].status !== 'request_sent') return error(res, 'Cannot accept campaign in current status', 400);

    await pool.query("UPDATE campaigns SET status = 'creator_accepted', updated_at = NOW() WHERE id = ?", [id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'creator_accepted', 'creator')", [id]);
    
    const [creator] = await pool.query('SELECT name FROM creators WHERE id=?', [req.user.id]);
    const [campaign] = await pool.query('SELECT brand_id, title FROM campaigns WHERE id=?', [id]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['brand', campaign[0].brand_id, 'Campaign Accepted', `${creator[0].name} accepted your campaign request for ${campaign[0].title}`]);

    broadcastCampaignUpdate(id, { status: 'creator_accepted', progress_step: 1 });
    success(res, { status: 'creator_accepted' });
  } catch (err) {
    next(err);
  }
};

exports.declineCampaign = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { reason } = req.body;
    const [camp] = await pool.query('SELECT creator_id, status FROM campaigns WHERE id = ?', [id]);
    if (!camp.length) return error(res, 'Campaign not found', 404);
    if (camp[0].creator_id !== req.user.id) return error(res, 'Forbidden', 403);
    if (camp[0].status !== 'request_sent') return error(res, 'Cannot decline campaign in current status', 400);

    await pool.query("UPDATE campaigns SET status = 'declined', rejection_reason = ?, updated_at = NOW() WHERE id = ?", [reason, id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'declined', 'creator', ?)", [id, reason]);
    
    const [creator] = await pool.query('SELECT name FROM creators WHERE id=?', [req.user.id]);
    const [campaign] = await pool.query('SELECT brand_id, title FROM campaigns WHERE id=?', [id]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['brand', campaign[0].brand_id, 'Campaign Declined', `${creator[0].name} declined your campaign request for ${campaign[0].title}`]);

    broadcastCampaignUpdate(id, { status: 'declined', progress_step: 0 });
    success(res, { status: 'declined' });
  } catch (err) {
    next(err);
  }
};

exports.uploadContent = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!req.file) return error(res, 'No content uploaded');
    const [camp] = await pool.query('SELECT creator_id, status FROM campaigns WHERE id = ?', [id]);
    if (camp[0].creator_id !== req.user.id) return error(res, 'Forbidden', 403);
    if (!['agreement_locked', 'content_uploaded'].includes(camp[0].status)) return error(res, 'Invalid status for content upload', 400);

    await pool.query("UPDATE campaigns SET content_url = ?, status = 'content_uploaded', updated_at = NOW() WHERE id = ?", [req.file.path, id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'content_uploaded', 'creator')", [id]);
    
    const [creator] = await pool.query('SELECT name FROM creators WHERE id=?', [req.user.id]);
    const [campaign] = await pool.query('SELECT brand_id, title FROM campaigns WHERE id=?', [id]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['brand', campaign[0].brand_id, 'Content Uploaded', `${creator[0].name} uploaded content for review: ${campaign[0].title}`]);

    success(res, { content_url: req.file.path, status: 'content_uploaded' });
  } catch (err) {
    next(err);
  }
};

exports.getCampaignDetail = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [rows] = await pool.query(`
      SELECT c.*, b.name AS brand_name, b.logo_url AS brand_logo, cr.name AS creator_name, cr.profile_photo
      FROM campaigns c
      JOIN brands b ON b.id = c.brand_id
      JOIN creators cr ON cr.id = c.creator_id
      WHERE c.id = ?
    `, [id]);

    if (!rows.length) return error(res, 'Campaign not found', 404);
    const campaign = rows[0];

    if (campaign.creator_id !== req.user.id && campaign.brand_id !== req.user.id && req.user.role !== 'admin') {
      return error(res, 'Forbidden', 403);
    }

    const [timeline] = await pool.query('SELECT * FROM campaign_timeline WHERE campaign_id = ? ORDER BY changed_at ASC', [id]);
    const [analytics] = await pool.query('SELECT * FROM campaign_analytics WHERE campaign_id = ?', [id]);
    const [negotiations] = await pool.query('SELECT * FROM campaign_negotiations WHERE campaign_id = ? ORDER BY created_at ASC', [id]);
    const [content_submissions] = await pool.query('SELECT * FROM content_submissions WHERE campaign_id = ? ORDER BY submitted_at DESC', [id]);

    success(res, { campaign, timeline, analytics: analytics[0], negotiations, content_submissions });
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const [camp] = await pool.query('SELECT creator_id FROM campaigns WHERE id = ?', [req.params.id]);
    if (camp[0].creator_id !== req.user.id) return error(res, 'Forbidden', 403);

    const [rows] = await pool.query('SELECT * FROM campaign_analytics WHERE campaign_id = ?', [req.params.id]);
    if (!rows.length) return error(res, 'Analytics not recorded yet', 404);
    success(res, rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.raiseDispute = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const [camp] = await pool.query('SELECT creator_id FROM campaigns WHERE id = ?', [req.params.id]);
    if (camp[0].creator_id !== req.user.id) return error(res, 'Forbidden', 403);

    await pool.query("INSERT INTO disputes (campaign_id, raised_by_type, raised_by_id, reason, status) VALUES (?, 'creator', ?, ?, 'open')", [req.params.id, req.user.id, reason]);
    success(res, null, 'Dispute raised');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/campaign/:id/negotiate
 * Submit a counter-offer (brand or creator).
 */
exports.submitNegotiation = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { amount, message } = req.body;

    // Load campaign
    const [camps] = await pool.query('SELECT * FROM campaigns WHERE id = ?', [id]);
    if (!camps.length) return error(res, 'Campaign not found', 404);
    const camp = camps[0];

    // Verify caller is brand or creator of this campaign
    if (req.user.id !== camp.brand_id && req.user.id !== camp.creator_id) {
      return error(res, 'Forbidden', 403);
    }

    // Validate amount
    if (!amount || Number(amount) <= 0) {
      return error(res, 'Offer amount must be greater than zero', 400);
    }

    // Determine proposed_by from role
    const proposed_by = req.user.role === 'brand' ? 'brand' : 'creator';

    // Insert negotiation row
    const [insertResult] = await pool.query(
      'INSERT INTO campaign_negotiations (campaign_id, proposed_by, amount, message) VALUES (?, ?, ?, ?)',
      [id, proposed_by, Number(amount), message || null]
    );

    // Update campaign status and negotiate_amount
    await pool.query(
      "UPDATE campaigns SET status = 'negotiating', negotiate_amount = ?, negotiate_message = ?, updated_at = NOW() WHERE id = ?",
      [Number(amount), message || null, id]
    );

    // Insert timeline row
    await pool.query(
      "INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'negotiating', ?, ?)",
      [id, proposed_by, `Counter-offer of ₹${amount} submitted`]
    );

    // Notify opposing party
    const notifyType = proposed_by === 'brand' ? 'creator' : 'brand';
    const notifyId   = proposed_by === 'brand' ? camp.creator_id : camp.brand_id;
    await pool.query(
      'INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)',
      [notifyType, notifyId, 'New Counter-Offer', `A new counter-offer of ₹${amount} has been submitted for "${camp.title}"`]
    );

    broadcastCampaignUpdate(id, { status: 'negotiating' });

    success(res, { negotiation_id: insertResult.insertId, status: 'negotiating' });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/campaign/:id/accept-offer
 * Accept the current negotiation offer.
 */
exports.acceptOffer = async (req, res, next) => {
  try {
    const id = req.params.id;

    // Load campaign
    const [camps] = await pool.query('SELECT * FROM campaigns WHERE id = ?', [id]);
    if (!camps.length) return error(res, 'Campaign not found', 404);
    const camp = camps[0];

    // Verify caller
    if (req.user.id !== camp.brand_id && req.user.id !== camp.creator_id) {
      return error(res, 'Forbidden', 403);
    }

    // Verify status
    if (camp.status !== 'negotiating') {
      return error(res, 'No active negotiation', 400);
    }

    const agreedAmount = camp.negotiate_amount;

    // Update campaign
    await pool.query(
      "UPDATE campaigns SET status = 'creator_accepted', budget = ?, updated_at = NOW() WHERE id = ?",
      [agreedAmount, id]
    );

    // Insert timeline row
    await pool.query(
      "INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'creator_accepted', ?, ?)",
      [id, req.user.role, `Offer of ₹${agreedAmount} accepted`]
    );

    // Notify both parties
    await pool.query(
      'INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)',
      ['brand', camp.brand_id, 'Offer Accepted', `The negotiation for "${camp.title}" has concluded. Agreed amount: ₹${agreedAmount}`]
    );
    await pool.query(
      'INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)',
      ['creator', camp.creator_id, 'Offer Accepted', `The negotiation for "${camp.title}" has concluded. Agreed amount: ₹${agreedAmount}`]
    );

    broadcastCampaignUpdate(id, { status: 'creator_accepted' });

    success(res, { status: 'creator_accepted', agreed_amount: agreedAmount });
  } catch (err) {
    next(err);
  }
};
