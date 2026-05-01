import pool from '../config/db.js';

export async function getEarnings(req, res) {
  try {
    const creatorId = req.user.id;
    const now = new Date();
    const cm = now.getMonth() + 1, cy = now.getFullYear();
    const lm = cm === 1 ? 12 : cm - 1, ly = cm === 1 ? cy - 1 : cy;

    const [totalReleased] = await pool.execute(`SELECT COALESCE(SUM(amount),0) as t FROM earnings WHERE creator_id=? AND payment_status='released'`, [creatorId]);
    const [available] = await pool.execute(`SELECT COALESCE(SUM(amount),0) as t FROM earnings WHERE creator_id=? AND payment_status='released' AND withdrawn_at IS NULL`, [creatorId]);
    const [pending] = await pool.execute(`SELECT COALESCE(SUM(amount),0) as t FROM earnings WHERE creator_id=? AND payment_status='in_escrow'`, [creatorId]);
    const [thisMonth] = await pool.execute(`SELECT COALESCE(SUM(amount),0) as t FROM earnings WHERE creator_id=? AND MONTH(created_at)=? AND YEAR(created_at)=?`, [creatorId, cm, cy]);
    const [lastMonth] = await pool.execute(`SELECT COALESCE(SUM(amount),0) as t FROM earnings WHERE creator_id=? AND MONTH(created_at)=? AND YEAR(created_at)=?`, [creatorId, lm, ly]);

    // Escrow campaigns
    const [escrowCampaigns] = await pool.execute(
      `SELECT e.amount, e.payment_status, c.id as campaign_id, c.title, c.status, b.name as brand_name
       FROM earnings e JOIN campaigns c ON e.campaign_id=c.id JOIN brands b ON c.brand_id=b.id
       WHERE e.creator_id=? AND e.payment_status='in_escrow'`, [creatorId]);

    // Transaction history
    const [transactions] = await pool.execute(
      `SELECT e.created_at as date, e.amount, e.payment_status, c.title as campaign_title, b.name as brand_name
       FROM earnings e JOIN campaigns c ON e.campaign_id=c.id JOIN brands b ON c.brand_id=b.id
       WHERE e.creator_id=? ORDER BY e.created_at DESC`, [creatorId]);

    // Monthly chart (6 months)
    const monthlyChart = [];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(cy, cm - 1 - i, 1);
      const m = d.getMonth() + 1, y = d.getFullYear();
      const [row] = await pool.execute(`SELECT COALESCE(SUM(amount),0) as t FROM earnings WHERE creator_id=? AND MONTH(created_at)=? AND YEAR(created_at)=?`, [creatorId, m, y]);
      monthlyChart.push({ month: monthNames[m - 1], total: Number(row[0].t) });
    }

    const tm = Number(thisMonth[0].t), lmv = Number(lastMonth[0].t);
    res.json({
      total_earned_all_time: Number(totalReleased[0].t),
      available_to_withdraw: Number(available[0].t),
      pending_release: Number(pending[0].t),
      this_month: tm,
      last_month: lmv,
      change_pct: lmv > 0 ? Math.round(((tm - lmv) / lmv) * 100) : 0,
      escrow_balance: {
        total: Number(pending[0].t),
        campaigns: escrowCampaigns.map(e => ({ brand: e.brand_name, title: e.title, amount: Number(e.amount), status: e.status, campaign_id: e.campaign_id }))
      },
      transaction_history: transactions.map(t => ({ date: t.date, brand_name: t.brand_name, campaign_title: t.campaign_title, amount: Number(t.amount), payment_status: t.payment_status })),
      monthly_chart: monthlyChart,
      payout_method: 'UPI — priya@paytm'
    });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to fetch earnings.' }); }
}

export async function withdraw(req, res) {
  try {
    const creatorId = req.user.id;
    const { amount, payout_method } = req.body;
    await pool.execute(`UPDATE earnings SET withdrawn_at=NOW(), payout_method=? WHERE creator_id=? AND payment_status='released' AND withdrawn_at IS NULL`, [payout_method || 'UPI', creatorId]);
    res.json({ message: 'Withdrawal initiated.' });
  } catch (error) { res.status(500).json({ error: 'Withdrawal failed.' }); }
}
