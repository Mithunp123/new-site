import pool from '../config/db.js';

export async function getAllCreators(req, res) {
  try {
    const [creators] = await pool.execute('SELECT id,name,email,is_verified,is_active,role,created_at FROM creators');
    res.json(creators);
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}

export async function verifyCreator(req, res) {
  try {
    await pool.execute('UPDATE creators SET is_verified=true WHERE id=?', [req.params.id]);
    res.json({ message: 'Creator verified.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}

export async function getAllCampaigns(req, res) {
  try {
    const [campaigns] = await pool.execute(
      `SELECT c.*, b.name as brand_name, cr.name as creator_name
       FROM campaigns c JOIN brands b ON c.brand_id=b.id JOIN creators cr ON c.creator_id=cr.id
       ORDER BY c.created_at DESC`);
    res.json(campaigns);
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}

export async function approveCampaign(req, res) {
  try {
    await pool.execute(`UPDATE campaigns SET status='brand_approved' WHERE id=?`, [req.params.id]);
    res.json({ message: 'Campaign approved.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}

export async function postLive(req, res) {
  try {
    await pool.execute(`UPDATE campaigns SET status='posted_live' WHERE id=?`, [req.params.id]);
    res.json({ message: 'Campaign posted live.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}

export async function releaseEscrow(req, res) {
  try {
    const { id } = req.params;
    const [campaign] = await pool.execute('SELECT * FROM campaigns WHERE id=?', [id]);
    if (!campaign.length) return res.status(404).json({ error: 'Not found.' });
    const c = campaign[0];
    await pool.execute(`UPDATE campaigns SET escrow_status='released', status='escrow_released' WHERE id=?`, [id]);
    await pool.execute(
      `INSERT INTO earnings (creator_id, campaign_id, amount, payment_status, released_at) VALUES (?,?,?,'released',NOW())`,
      [c.creator_id, id, c.escrow_amount]);
    res.json({ message: 'Escrow released.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}

export async function closeCampaign(req, res) {
  try {
    await pool.execute(`UPDATE campaigns SET status='campaign_closed' WHERE id=?`, [req.params.id]);
    res.json({ message: 'Campaign closed.' });
  } catch (error) { res.status(500).json({ error: 'Failed.' }); }
}
