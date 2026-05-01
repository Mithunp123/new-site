import pool from '../config/db.js';

const statusMap = {
  'request_sent': 0, 'creator_accepted': 1, 'agreement_locked': 2,
  'content_uploaded': 3, 'brand_approved': 4, 'posted_live': 5,
  'analytics_collected': 6, 'escrow_released': 7, 'campaign_closed': 8
};

export async function getRequests(req, res) {
  try {
    const creatorId = req.user.id;
    const { status, search } = req.query;
    let query = `SELECT c.*, b.name as brand_name, b.logo_url as brand_logo, b.category as brand_category
                 FROM campaigns c JOIN brands b ON c.brand_id = b.id WHERE c.creator_id = ?`;
    const params = [creatorId];

    if (status === 'pending') query += ` AND c.status = 'request_sent'`;
    else if (status === 'accepted') query += ` AND c.status IN ('creator_accepted','agreement_locked','content_uploaded','brand_approved','posted_live','analytics_collected')`;
    else if (status === 'completed') query += ` AND c.status IN ('escrow_released','campaign_closed')`;

    if (search) { query += ` AND (c.title LIKE ? OR b.name LIKE ?)`; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY c.created_at DESC';

    const [campaigns] = await pool.execute(query, params);
    const [counts] = await pool.execute(
      `SELECT SUM(CASE WHEN status='request_sent' THEN 1 ELSE 0 END) as pending,
              SUM(CASE WHEN status IN ('creator_accepted','agreement_locked','content_uploaded','brand_approved','posted_live','analytics_collected') THEN 1 ELSE 0 END) as accepted,
              SUM(CASE WHEN status IN ('escrow_released','campaign_closed') THEN 1 ELSE 0 END) as completed,
              COUNT(*) as total FROM campaigns WHERE creator_id = ?`, [creatorId]);

    res.json({
      counts: { pending: Number(counts[0].pending), accepted: Number(counts[0].accepted), completed: Number(counts[0].completed), total: Number(counts[0].total) },
      campaigns: campaigns.map(c => ({
        id: c.id, brand_name: c.brand_name, brand_logo: c.brand_logo, brand_category: c.brand_category,
        title: c.title, deliverable: c.deliverable, brief: c.brief, tracking_link: c.tracking_link,
        deadline: c.deadline, status: c.status, escrow_amount: Number(c.escrow_amount),
        escrow_status: c.escrow_status, respond_by: c.respond_by, created_at: c.created_at
      }))
    });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch requests.' }); }
}

export async function acceptCampaign(req, res) {
  try {
    const [c] = await pool.execute('SELECT * FROM campaigns WHERE id = ? AND creator_id = ?', [req.params.id, req.user.id]);
    if (!c.length) return res.status(404).json({ error: 'Campaign not found.' });
    await pool.execute(`UPDATE campaigns SET status='creator_accepted', escrow_status='held' WHERE id=?`, [req.params.id]);
    res.json({ message: 'Campaign accepted.' });
  } catch (error) { res.status(500).json({ error: 'Failed to accept campaign.' }); }
}

export async function declineCampaign(req, res) {
  try {
    const [c] = await pool.execute('SELECT * FROM campaigns WHERE id = ? AND creator_id = ?', [req.params.id, req.user.id]);
    if (!c.length) return res.status(404).json({ error: 'Campaign not found.' });
    await pool.execute(`UPDATE campaigns SET status='campaign_closed' WHERE id=?`, [req.params.id]);
    res.json({ message: 'Campaign declined.' });
  } catch (error) { res.status(500).json({ error: 'Failed to decline.' }); }
}

export async function negotiateCampaign(req, res) {
  try {
    const { proposed_amount, message } = req.body;
    await pool.execute('INSERT INTO negotiations (campaign_id, creator_id, proposed_amount, message) VALUES (?,?,?,?)',
      [req.params.id, req.user.id, proposed_amount, message]);
    res.json({ message: 'Negotiation sent.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}

export async function getMyCampaigns(req, res) {
  try {
    const creatorId = req.user.id;
    const { status } = req.query;
    let query = `SELECT c.*, b.name as brand_name, b.logo_url as brand_logo FROM campaigns c JOIN brands b ON c.brand_id = b.id WHERE c.creator_id = ?`;
    const params = [creatorId];
    if (status === 'active') query += ` AND c.status NOT IN ('campaign_closed','escrow_released')`;
    else if (status === 'completed') query += ` AND c.status IN ('campaign_closed','escrow_released')`;
    query += ' ORDER BY c.updated_at DESC';

    const [campaigns] = await pool.execute(query, params);
    const [counts] = await pool.execute(
      `SELECT SUM(CASE WHEN status NOT IN ('campaign_closed','escrow_released') THEN 1 ELSE 0 END) as active_count,
              SUM(CASE WHEN status IN ('campaign_closed','escrow_released') THEN 1 ELSE 0 END) as completed_count
       FROM campaigns WHERE creator_id = ?`, [creatorId]);

    const activeCamps = campaigns.filter(c => !['campaign_closed','escrow_released'].includes(c.status));
    const featured = activeCamps[0] || null;

    res.json({
      active_count: Number(counts[0].active_count), completed_count: Number(counts[0].completed_count),
      featured_campaign: featured ? {
        id: featured.id, brand_name: featured.brand_name, title: featured.title, deliverable: featured.deliverable,
        deadline: featured.deadline, escrow_amount: Number(featured.escrow_amount), escrow_status: featured.escrow_status,
        status: featured.status, progress_step: statusMap[featured.status] || 0
      } : null,
      all_campaigns: campaigns.map(c => ({
        id: c.id, brand_name: c.brand_name, title: c.title, deliverable: c.deliverable,
        amount: Number(c.escrow_amount), escrow_status: c.escrow_status, progress_step: statusMap[c.status] || 0,
        status: c.status, deadline: c.deadline
      }))
    });
  } catch (error) { res.status(500).json({ error: 'Failed to fetch campaigns.' }); }
}

export async function uploadContent(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
    const [c] = await pool.execute('SELECT * FROM campaigns WHERE id = ? AND creator_id = ?', [req.params.id, req.user.id]);
    if (!c.length) return res.status(404).json({ error: 'Not found.' });
    await pool.execute(`UPDATE campaigns SET content_url=?, status='content_uploaded' WHERE id=?`, [req.file.path, req.params.id]);
    res.json({ message: 'Content uploaded.', content_url: req.file.path });
  } catch (error) { res.status(500).json({ error: 'Upload failed.' }); }
}
