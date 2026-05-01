import pool from '../config/db.js';

export async function getLeads(req, res) {
  try {
    const creatorId = req.user.id;

    const [totalLeads] = await pool.execute('SELECT COUNT(*) as t FROM leads WHERE creator_id=?', [creatorId]);
    const [converted] = await pool.execute('SELECT COUNT(*) as t FROM leads WHERE creator_id=? AND converted=true', [creatorId]);
    const [avgDeal] = await pool.execute('SELECT COALESCE(AVG(deal_value),0) as t FROM leads WHERE creator_id=?', [creatorId]);

    const total = Number(totalLeads[0].t);
    const conv = Number(converted[0].t);
    const convRate = total > 0 ? Number((conv / total * 100).toFixed(1)) : 0;

    // Leads by campaign
    const [byCampaign] = await pool.execute(
      `SELECT c.title as campaign_title, COUNT(l.id) as lead_count
       FROM leads l JOIN campaigns c ON l.campaign_id=c.id
       WHERE l.creator_id=? GROUP BY c.id ORDER BY lead_count DESC LIMIT 5`, [creatorId]);

    // Leads by niche
    const [byNiche] = await pool.execute(
      `SELECT niche, COUNT(*) as total, SUM(CASE WHEN converted=true THEN 1 ELSE 0 END) as conv
       FROM leads WHERE creator_id=? GROUP BY niche ORDER BY total DESC`, [creatorId]);

    res.json({
      total_leads: total, conversion_rate: convRate,
      avg_deal_value: Math.round(Number(avgDeal[0].t)),
      top_performing_niche: byNiche.length > 0 ? byNiche[0].niche : 'N/A',
      leads_by_campaign: byCampaign.map(c => ({ campaign_title: c.campaign_title, lead_count: Number(c.lead_count) })),
      leads_by_niche: byNiche.map(n => ({ niche: n.niche, conversion_rate: Number(n.total) > 0 ? Number((Number(n.conv) / Number(n.total) * 100).toFixed(1)) : 0 }))
    });
  } catch (error) { console.error(error); res.status(500).json({ error: 'Failed to fetch leads.' }); }
}
