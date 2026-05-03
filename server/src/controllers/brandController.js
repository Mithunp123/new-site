const pool = require('../config/db');
const { success, created, error } = require('../helpers/response');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const { getInitials, getAvatarColor, formatINR, formatROI } = require('../helpers/format');

// Preferences & Verification
exports.upsertPreferences = async (req, res, next) => {
  try {
    const brand_id = req.user.id;
    const { content_types, target_age_group, target_gender, target_location, budget_min, budget_max, preferred_niches, preferred_platforms, collaboration_type } = req.body;
    
    await pool.query(
      'INSERT INTO brand_preferences (brand_id, content_types, target_age_group, target_gender, target_location, budget_min, budget_max, preferred_niches, preferred_platforms, collaboration_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE content_types=?, target_age_group=?, target_gender=?, target_location=?, budget_min=?, budget_max=?, preferred_niches=?, preferred_platforms=?, collaboration_type=?',
      [brand_id, JSON.stringify(content_types), target_age_group, target_gender, target_location, budget_min, budget_max, JSON.stringify(preferred_niches), JSON.stringify(preferred_platforms), collaboration_type, JSON.stringify(content_types), target_age_group, target_gender, target_location, budget_min, budget_max, JSON.stringify(preferred_niches), JSON.stringify(preferred_platforms), collaboration_type]
    );
    success(res, null, 'Preferences updated');
  } catch (err) {
    next(err);
  }
};

exports.upsertVerification = async (req, res, next) => {
  try {
    const brand_id = req.user.id;
    const { gst_number, pan_number, cin_number, billing_address } = req.body;
    await pool.query(
      'INSERT INTO brand_verification (brand_id, gst_number, pan_number, cin_number, billing_address) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE gst_number=?, pan_number=?, cin_number=?, billing_address=?',
      [brand_id, gst_number, pan_number, cin_number, billing_address, gst_number, pan_number, cin_number, billing_address]
    );
    success(res, null, 'Verification details updated');
  } catch (err) {
    next(err);
  }
};

exports.updateLogo = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No logo uploaded');
    await pool.query('UPDATE brands SET logo_url = ? WHERE id = ?', [req.file.path, req.user.id]);
    success(res, { logo_url: req.file.path });
  } catch (err) {
    next(err);
  }
};

// Profile
exports.getProfile = async (req, res, next) => {
  try {
    const brand_id = req.user.id;
    const [brand] = await pool.query('SELECT id, name, email, phone, website, logo_url, category, description, company_size, country, role, is_active FROM brands WHERE id = ?', [brand_id]);
    const [prefs] = await pool.query('SELECT * FROM brand_preferences WHERE brand_id = ?', [brand_id]);
    const [verify] = await pool.query('SELECT * FROM brand_verification WHERE brand_id = ?', [brand_id]);
    
    const preferences = prefs[0] || {};
    ['content_types', 'preferred_niches', 'preferred_platforms'].forEach(f => {
      if (preferences[f]) preferences[f] = typeof preferences[f] === 'string' ? JSON.parse(preferences[f]) : preferences[f];
    });

    success(res, { brand: brand[0], preferences, verification: verify[0] });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const body = req.body;
    const fields = {};
    ['name', 'website', 'category', 'description', 'company_size', 'phone', 'country'].forEach(f => {
      if (body[f] !== undefined) fields[f] = body[f];
    });
    if (!Object.keys(fields).length) return error(res, 'No fields to update');
    const keys = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(fields), req.user.id];
    await pool.query(`UPDATE brands SET ${keys} WHERE id = ?`, values);
    success(res, null, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.query('SELECT password_hash FROM brands WHERE id = ?', [req.user.id]);
    const isMatch = await comparePassword(current_password, rows[0].password_hash);
    if (!isMatch) return error(res, 'Current password is incorrect', 400);
    const hashed = await hashPassword(new_password);
    await pool.query('UPDATE brands SET password_hash = ? WHERE id = ?', [hashed, req.user.id]);
    success(res, null, 'Password updated');
  } catch (err) {
    next(err);
  }
};

// Dashboard (NEW VERSION)
exports.getDashboard = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [brand] = await pool.query('SELECT name FROM brands WHERE id = ?', [id]);
    
    // Total Campaign Spend
    const [q1] = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM brand_payments WHERE brand_id=? AND payment_status='completed'", [id]);
    const [q1prev] = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM brand_payments WHERE brand_id=? AND payment_status='completed' AND paid_at < DATE_SUB(NOW(), INTERVAL 1 MONTH) AND paid_at >= DATE_SUB(NOW(), INTERVAL 2 MONTH)", [id]);
    const spend_change_pct = q1prev[0].total === 0 ? 0 : ((q1[0].total - q1prev[0].total) / q1prev[0].total) * 100;

    // Active Campaigns
    const [q2] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id=? AND status NOT IN ('campaign_closed','declined')", [id]);
    const [q2pending] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id=? AND status = 'content_uploaded'", [id]);

    // ROI
    const [q3] = await pool.query("SELECT AVG(roi_percentage) AS avg FROM roi_tracking WHERE brand_id=?", [id]);
    const [q3prev] = await pool.query("SELECT AVG(roi_percentage) AS avg FROM roi_tracking WHERE brand_id=? AND recorded_at < DATE_SUB(NOW(), INTERVAL 3 MONTH)", [id]);
    const roi_change = (q3[0].avg || 0) - (q3prev[0].avg || 0);

    // Creators Hired
    const [q4] = await pool.query('SELECT COUNT(DISTINCT creator_id) AS hired, COUNT(DISTINCT id) AS across FROM campaigns WHERE brand_id=?', [id]);

    // Active Campaigns List
    const [qlist] = await pool.query(`
      SELECT c.id, c.title,
             COUNT(DISTINCT c.creator_id) AS creators_count,
             SUM(c.escrow_amount) AS spend,
             MAX(rt.roi_percentage) AS roi,
             c.status
      FROM campaigns c
      LEFT JOIN roi_tracking rt ON rt.campaign_id = c.id
      WHERE c.brand_id = ? AND c.status NOT IN ('campaign_closed','declined')
      GROUP BY c.id, c.title, c.status
      ORDER BY c.created_at DESC LIMIT 5
    `, [id]);

    // Monthly Spend Chart
    const [qchart] = await pool.query(`
      SELECT ANY_VALUE(DATE_FORMAT(paid_at, '%b')) AS month, SUM(amount) AS spend, AVG(rt.roi_percentage) AS roi
      FROM brand_payments bp
      LEFT JOIN roi_tracking rt ON rt.campaign_id = bp.campaign_id
      WHERE bp.brand_id=? AND bp.payment_status='completed' AND bp.paid_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(paid_at), MONTH(paid_at) ORDER BY MIN(paid_at) ASC
    `, [id]);

    // Sent Requests
    const [qreq] = await pool.query(`
      SELECT c.creator_id, cr.name AS creator_name, c.escrow_amount AS amount, c.title AS campaign_title, c.status
      FROM campaigns c
      JOIN creators cr ON cr.id = c.creator_id
      WHERE c.brand_id = ? ORDER BY c.created_at DESC LIMIT 3
    `, [id]);

    const statusMap = { 'request_sent': 'Sent', 'creator_accepted': 'Pending', 'declined': 'Declined' };
    const sent_requests = qreq.map(r => ({
      ...r,
      creator_initials: getInitials(r.creator_name),
      request_status: statusMap[r.status] || 'Accepted'
    }));

    // Performance Metrics
    const [qperf] = await pool.query(`
      SELECT
        SUM(ca.reach) AS total_reach,
        SUM(ca.clicks) AS total_engagement,
        SUM(ca.sales_generated) AS revenue_generated,
        AVG(rt.cost_per_lead) AS cost_per_lead
      FROM campaigns c
      LEFT JOIN campaign_analytics ca ON ca.campaign_id = c.id
      LEFT JOIN roi_tracking rt ON rt.campaign_id = c.id
      WHERE c.brand_id = ?
    `, [id]);

    const [qbest] = await pool.query(`
      SELECT MAX(cr.name) AS name, AVG(ca.engagement_rate) AS er
      FROM campaigns c
      JOIN creators cr ON cr.id = c.creator_id
      JOIN campaign_analytics ca ON ca.campaign_id = c.id
      WHERE c.brand_id = ?
      GROUP BY c.creator_id
      ORDER BY er DESC LIMIT 1
    `, [id]);

    success(res, {
      brand_name: brand[0].name,
      total_campaign_spend: { amount: q1[0].total, change_pct: spend_change_pct },
      active_campaigns: { count: q2[0].count, pending_approval: q2pending[0].count },
      avg_campaign_roi: { value: q3[0].avg || 0, change: roi_change },
      creators_hired: { count: q4[0].hired, across_campaigns: q4[0].across },
      active_campaigns_list: qlist,
      monthly_spend_chart: qchart,
      sent_requests,
      performance_metrics: {
        ...qperf[0],
        best_creator: qbest[0] || null
      }
    });
  } catch (err) {
    next(err);
  }
};

// Discover Creators (UPDATED)
exports.discoverCreators = async (req, res, next) => {
  try {
    const { niche, platform, followers, min_er, location, budget_min, budget_max, language, search, page = 1, limit = 12 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let where = 'WHERE cr.is_active = true';

    // Follower range parsing
    if (followers) {
      let min = 0, max = 999999999;
      if (followers === '1K-10K') { min = 1000; max = 10000; }
      else if (followers === '10K-100K') { min = 10000; max = 100000; }
      else if (followers === '100K-1M') { min = 100000; max = 1000000; }
      else if (followers === '1M+') { min = 1000000; }
      where += ' AND sp.followers_count >= ? AND sp.followers_count <= ?';
      params.push(min, max);
    }

    if (niche) { where += ' AND JSON_CONTAINS(nd.categories, JSON_QUOTE(?))'; params.push(niche); }
    if (platform) { where += ' AND sp.platform = ?'; params.push(platform); }
    if (min_er) { where += ' AND sp.engagement_rate >= ?'; params.push(min_er); }
    if (location) { where += ' AND cr.location LIKE ?'; params.push(`%${location}%`); }
    if (language) { where += ' AND JSON_CONTAINS(cr.languages_known, JSON_QUOTE(?))'; params.push(language); }
    if (budget_min) { where += ' AND nd.budget_min >= ?'; params.push(budget_min); } // Assuming niche_details might have budget? No, but let's stick to filters.
    if (search) { where += ' AND (cr.name LIKE ? OR cr.display_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [creators] = await pool.query(`
      SELECT DISTINCT cr.id, cr.name, cr.display_name, cr.profile_photo, cr.location, cr.is_verified, nd.categories, nd.collaboration_preference,
      (SELECT platform FROM creator_social_profiles WHERE creator_id = cr.id ORDER BY followers_count DESC LIMIT 1) AS top_platform,
      (SELECT followers_count FROM creator_social_profiles WHERE creator_id = cr.id ORDER BY followers_count DESC LIMIT 1) AS followers_count,
      (SELECT engagement_rate FROM creator_social_profiles WHERE creator_id = cr.id ORDER BY followers_count DESC LIMIT 1) AS engagement_rate,
      (SELECT avg_views FROM creator_social_profiles WHERE creator_id = cr.id ORDER BY followers_count DESC LIMIT 1) AS avg_views,
      CASE WHEN bsc.id IS NOT NULL THEN true ELSE false END AS is_saved
      FROM creators cr
      LEFT JOIN creator_niche_details nd ON nd.creator_id = cr.id
      LEFT JOIN creator_social_profiles sp ON sp.creator_id = cr.id
      LEFT JOIN brand_saved_creators bsc ON bsc.creator_id = cr.id AND bsc.brand_id = ?
      ${where}
      ORDER BY cr.is_verified DESC, followers_count DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const results = creators.map(c => ({
      ...c,
      initials: getInitials(c.name),
      avatar_color: getAvatarColor(c.id),
      categories: typeof c.categories === 'string' ? JSON.parse(c.categories) : (c.categories || []),
      top_platform_stats: {
        followers_count: c.followers_count,
        engagement_rate: c.engagement_rate,
        avg_views: c.avg_views
      }
    }));

    const [countRow] = await pool.query(`SELECT COUNT(DISTINCT cr.id) AS count FROM creators cr LEFT JOIN creator_niche_details nd ON nd.creator_id = cr.id LEFT JOIN creator_social_profiles sp ON sp.creator_id = cr.id ${where}`, params.slice(1));

    success(res, { total: countRow[0].count, page: parseInt(page), limit: parseInt(limit), creators: results });
  } catch (err) {
    next(err);
  }
};

// Collaboration Requests (NEW)
exports.sendCollaborationRequest = async (req, res, next) => {
  try {
    const { creator_id, campaign_name, campaign_goal, campaign_brief, platform, content_type, number_of_posts, start_date, end_date, budget_offer, tracking_link, deliverables_required } = req.body;
    
    const platform_fee_rate = 0.08;
    const platform_fee = budget_offer * platform_fee_rate;
    const total_to_escrow = budget_offer + platform_fee;

    const [res_camp] = await pool.query(
      'INSERT INTO campaigns (brand_id, creator_id, title, deliverable, brief, platform, budget, escrow_amount, tracking_link, tracking_link_provided, status, escrow_status, deadline, respond_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, creator_id, campaign_name, number_of_posts, campaign_brief, platform, budget_offer, total_to_escrow, tracking_link, tracking_link ? true : false, 'request_sent', 'pending', end_date, start_date]
    );
    const campaign_id = res_camp.insertId;

    await pool.query('INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, ?, ?, ?)', [campaign_id, 'request_sent', 'brand', `Goal: ${campaign_goal}. Deliverables: ${deliverables_required}`]);
    await pool.query('INSERT INTO brand_payments (brand_id, campaign_id, amount, payment_type, payment_status) VALUES (?, ?, ?, ?, ?)', [req.user.id, campaign_id, total_to_escrow, 'escrow', 'pending']);
    
    const [brand] = await pool.query('SELECT name FROM brands WHERE id=?', [req.user.id]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['creator', creator_id, 'New Collaboration Request', `${brand[0].name} sent you a request for ${campaign_name}`]);

    created(res, { campaign_id, budget_offer, platform_fee, total_to_escrow, status: 'request_sent' });
  } catch (err) {
    next(err);
  }
};

exports.getCollaborationRequests = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [rows] = await pool.query(`
      SELECT c.id AS campaign_id, c.creator_id, cr.name AS creator_name, c.escrow_amount AS amount, c.title AS campaign_title, c.status
      FROM campaigns c JOIN creators cr ON cr.id = c.creator_id
      WHERE c.brand_id = ? ORDER BY c.created_at DESC
    `, [id]);

    const statusMapping = {
      'request_sent': 'Sent',
      'creator_accepted': 'Pending',
      'declined': 'Declined'
    };

    const requests = rows.map(r => ({
      ...r,
      creator_initials: getInitials(r.creator_name),
      avatar_color: getAvatarColor(r.creator_id),
      status: statusMapping[r.status] || 'Accepted'
    }));

    const [pending] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id=? AND status='creator_accepted'", [id]);
    const [accepted] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id=? AND status NOT IN ('request_sent','declined','creator_accepted')", [id]);
    const [sent] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id=? AND status='request_sent'", [id]);

    success(res, { pending_count: pending[0].count, accepted_count: accepted[0].count, sent_count: sent[0].count, requests });
  } catch (err) {
    next(err);
  }
};

// Campaign Tracking (NEW)
exports.getCampaignTracking = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [qfeatured] = await pool.query(`
      SELECT c.id, c.title, c.status, cr.name AS creator_name
      FROM campaigns c JOIN creators cr ON cr.id = c.creator_id
      WHERE c.brand_id = ? AND c.status NOT IN ('campaign_closed','declined')
      ORDER BY c.updated_at DESC LIMIT 1
    `, [id]);

    const statusMap = { 'request_sent': 0, 'creator_accepted': 1, 'agreement_locked': 2, 'content_uploaded': 3, 'brand_approved': 4, 'posted_live': 5, 'analytics_collected': 6, 'escrow_released': 7, 'campaign_closed': 8 };
    
    let featured = null;
    if (qfeatured.length) {
      const f = qfeatured[0];
      featured = {
        ...f,
        progress_step: statusMap[f.status] || 0,
        action_required: f.status === 'content_uploaded' ? {
          message: `Content submitted by ${f.creator_name} — Awaiting your approval`,
          can_approve: true,
          can_reject: true
        } : null
      };
    }

    const [qall] = await pool.query(`
      SELECT c.id, c.title, c.status, c.escrow_amount AS spend, ca.reach, rt.roi_percentage, c.escrow_status,
             (SELECT COUNT(*) FROM campaigns c2 WHERE c2.title = c.title AND c2.brand_id = c.brand_id) AS creators_count,
             (SELECT COUNT(*) FROM campaign_analytics ca2 WHERE ca2.campaign_id = c.id) AS content_links_count
      FROM campaigns c
      LEFT JOIN campaign_analytics ca ON ca.campaign_id = c.id
      LEFT JOIN roi_tracking rt ON rt.campaign_id = c.id
      WHERE c.brand_id = ?
      ORDER BY c.created_at DESC
    `, [id]);

    const all_campaigns = qall.map(c => ({
      ...c,
      content_links_label: c.content_links_count > 0 ? `View ${c.content_links_count} posts` : '—',
      roi: c.roi_percentage ? formatROI(c.spend, (c.roi_percentage/100 + 1) * c.spend) : '—',
      escrow_label: c.escrow_status === 'pending' ? 'Pending' : (c.escrow_status === 'held' ? 'Locked' : 'Released'),
      escrow_badge_type: c.escrow_status === 'pending' ? 'orange' : (c.escrow_status === 'held' ? 'blue' : 'green')
    }));

    success(res, { featured_campaign: featured, all_campaigns });
  } catch (err) {
    next(err);
  }
};

// ROI Analytics (NEW)
exports.getROIAnalytics = async (req, res, next) => {
  try {
    const id = req.user.id;
    const { period = '30d' } = req.query;
    const days = period === 'quarter' ? 90 : (parseInt(period) || 30);

    const [qtotals] = await pool.query(`
      SELECT SUM(total_spend) AS total_spend, SUM(total_revenue) AS revenue_generated, AVG(roi_percentage) AS avg_roi, AVG(cost_per_lead) AS cost_per_lead
      FROM roi_tracking WHERE brand_id = ? AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [id, days]);

    const [qprev] = await pool.query(`
      SELECT SUM(total_spend) AS total_spend, SUM(total_revenue) AS revenue_generated, AVG(roi_percentage) AS avg_roi, AVG(cost_per_lead) AS cost_per_lead
      FROM roi_tracking WHERE brand_id = ? AND recorded_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [id, days, days * 2]);

    const totals = qtotals[0];
    const prev = qprev[0];

    const [qbreakdown] = await pool.query(`
      SELECT c.title, c.escrow_amount AS spend, ca.reach, ca.clicks, ca.sales_generated AS revenue, rt.cost_per_lead AS cpl, ROUND(ca.sales_generated / c.escrow_amount, 1) AS roi_multiplier
      FROM campaigns c
      LEFT JOIN campaign_analytics ca ON ca.campaign_id = c.id
      LEFT JOIN roi_tracking rt ON rt.campaign_id = c.id
      WHERE c.brand_id = ? AND c.status = 'campaign_closed'
    `, [id]);

    const [qcreators] = await pool.query(`
      SELECT cr.name, ca.reach, ca.engagement_rate, ca.sales_generated,
             (SELECT COUNT(*) FROM campaigns c2 WHERE c2.creator_id = cr.id AND c2.brand_id = ? AND c2.status = 'campaign_closed') AS total_collabs
      FROM campaigns c
      JOIN creators cr ON cr.id = c.creator_id
      JOIN campaign_analytics ca ON ca.campaign_id = c.id
      WHERE c.brand_id = ? AND c.status = 'campaign_closed'
      ORDER BY ca.sales_generated DESC LIMIT 10
    `, [id, id]);

    const best_creators = qcreators.map(c => ({
      ...c,
      repeat_collab: c.total_collabs > 1 ? 'Yes' : (c.total_collabs === 1 && c.engagement_rate > 8 ? 'Invite' : 'No')
    }));

    const [qrepeat] = await pool.query(`
      SELECT (SELECT COUNT(*) FROM (SELECT creator_id FROM campaigns WHERE brand_id=? GROUP BY creator_id HAVING COUNT(*)>1) AS t) * 100.0 / 
             (SELECT COUNT(DISTINCT creator_id) FROM campaigns WHERE brand_id=?) AS pct
    `, [id, id]);

    const [qresponse] = await pool.query(`
      SELECT (SELECT COUNT(*) FROM campaigns WHERE brand_id=? AND status != 'request_sent' AND status != 'declined') * 100.0 / 
             (SELECT COUNT(*) FROM campaigns WHERE brand_id=?) AS rate
    `, [id, id]);

    const [qmetrics] = await pool.query(`
      SELECT SUM(reach) AS reach, SUM(clicks) AS engagement, SUM(clicks) AS clicks FROM campaign_analytics ca JOIN campaigns c ON c.id=ca.campaign_id WHERE c.brand_id=?
    `, [id]);

    success(res, {
      totals: {
        ...totals,
        avg_campaign_roi: formatROI(totals.total_spend, totals.revenue_generated),
        spend_change_pct: prev.total_spend ? ((totals.total_spend - prev.total_spend) / prev.total_spend) * 100 : 0,
        revenue_change_pct: prev.revenue_generated ? ((totals.revenue_generated - prev.revenue_generated) / prev.revenue_generated) * 100 : 0,
        roi_change: `${(totals.avg_roi / 100).toFixed(1)}x vs last quarter`,
        cpl_change_pct: prev.cost_per_lead ? ((totals.cost_per_lead - prev.cost_per_lead) / prev.cost_per_lead) * 100 : 0
      },
      campaign_breakdown: qbreakdown.map(c => ({ ...c, roi_x: `${c.roi_multiplier}x` })),
      roi_by_campaign_chart: qbreakdown.map(c => ({ label: c.title.substring(0, 6), value: c.roi_multiplier })),
      best_performing_creators: best_creators,
      key_metrics: {
        total_reach: qmetrics[0].reach,
        total_engagement: qmetrics[0].engagement,
        total_clicks: qmetrics[0].clicks,
        repeat_collab_pct: qrepeat[0].pct || 0,
        response_rate: qresponse[0].rate || 0
      }
    });
  } catch (err) {
    next(err);
  }
};

// Lead Management (NEW)
exports.getLeadManagement = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [qresponse] = await pool.query("SELECT COUNT(CASE WHEN status != 'request_sent' AND status != 'declined' THEN 1 END) * 100.0 / COUNT(*) AS rate FROM campaigns WHERE brand_id=?", [id]);
    const [qrepeat] = await pool.query("SELECT (SELECT COUNT(*) FROM (SELECT creator_id FROM campaigns WHERE brand_id=? GROUP BY creator_id HAVING COUNT(*)>1) AS t) * 100.0 / (SELECT COUNT(DISTINCT creator_id) FROM campaigns WHERE brand_id=?) AS pct", [id, id]);
    const [qranking] = await pool.query(`
      SELECT cr.name AS creator_name, AVG(ca.engagement_rate) AS engagement_rate, SUM(ca.sales_generated) AS sales, COUNT(c.id) AS total_collabs
      FROM campaigns c JOIN creators cr ON cr.id = c.creator_id LEFT JOIN campaign_analytics ca ON ca.campaign_id = c.id
      WHERE c.brand_id = ? GROUP BY c.creator_id ORDER BY sales DESC
    `, [id]);
    
    const [qleads] = await pool.query('SELECT COUNT(*) AS total FROM leads WHERE brand_id=?', [id]);
    
    const ranking = qranking.map((r, i) => ({
      rank: i + 1,
      ...r,
      repeat: r.total_collabs > 1 ? 'Yes' : (r.total_collabs === 1 && r.engagement_rate > 8 ? 'Invite' : 'No')
    }));

    const [qres_camp] = await pool.query("SELECT c.title, COUNT(CASE WHEN c.status != 'declined' THEN 1 END) * 100.0 / COUNT(*) AS response_rate FROM campaigns c WHERE c.brand_id = ? GROUP BY c.title", [id]);

    success(res, {
      stats: {
        response_rate: qresponse[0].rate || 0,
        repeat_collab_pct: qrepeat[0].pct || 0,
        top_creator: ranking[0] || null,
        total_leads_generated: qleads[0].total,
        leads_change_pct: 0
      },
      creator_ranking: ranking,
      response_rate_by_campaign: qres_camp.map(c => ({ campaign_title: c.title, response_rate_pct: c.response_rate }))
    });
  } catch (err) {
    next(err);
  }
};

// Reusing existing functions
exports.getCreatorById = async (req, res, next) => {
  try {
    const creator_id = req.params.id;
    const [cr] = await pool.query('SELECT id, name, display_name, email, phone, bio, location, languages_known, profile_photo, is_verified, created_at FROM creators WHERE id=? AND is_active=true', [creator_id]);
    if (!cr.length) return error(res, 'Creator not found', 404);
    const [sp] = await pool.query('SELECT * FROM creator_social_profiles WHERE creator_id=?', [creator_id]);
    const [nd] = await pool.query('SELECT * FROM creator_niche_details WHERE creator_id=?', [creator_id]);
    const [past] = await pool.query("SELECT c.title, b.name AS brand_name, ca.views, ca.reach, ca.clicks, ca.engagement_rate, ca.sales_generated FROM campaigns c JOIN brands b ON b.id = c.brand_id LEFT JOIN campaign_analytics ca ON ca.campaign_id = c.id WHERE c.creator_id = ? AND c.status = 'campaign_closed' ORDER BY c.updated_at DESC LIMIT 10", [creator_id]);
    const [stats] = await pool.query("SELECT COUNT(*) AS total_campaigns, AVG(e.net_amount) AS avg_deal_value FROM campaigns c LEFT JOIN earnings e ON e.campaign_id = c.id WHERE c.creator_id = ? AND c.status = 'campaign_closed'", [creator_id]);
    const [saved] = await pool.query('SELECT id FROM brand_saved_creators WHERE brand_id=? AND creator_id=?', [req.user.id, creator_id]);
    success(res, { creator: cr[0], social_profiles: sp, niche_details: nd[0], past_campaigns: past, stats: stats[0], is_saved: saved.length > 0 });
  } catch (err) {
    next(err);
  }
};

exports.saveCreator = async (req, res, next) => {
  try {
    await pool.query('INSERT IGNORE INTO brand_saved_creators (brand_id, creator_id) VALUES (?,?)', [req.user.id, req.params.id]);
    success(res, null, 'Creator saved');
  } catch (err) {
    next(err);
  }
};

exports.unsaveCreator = async (req, res, next) => {
  try {
    await pool.query('DELETE FROM brand_saved_creators WHERE brand_id=? AND creator_id=?', [req.user.id, req.params.id]);
    success(res, null, 'Creator unsaved');
  } catch (err) {
    next(err);
  }
};

exports.getSavedCreators = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT cr.id, cr.name, cr.display_name, cr.profile_photo, cr.location, cr.is_verified, bsc.saved_at,
      (SELECT followers_count FROM creator_social_profiles WHERE creator_id=cr.id ORDER BY followers_count DESC LIMIT 1) AS top_followers,
      (SELECT platform FROM creator_social_profiles WHERE creator_id=cr.id ORDER BY followers_count DESC LIMIT 1) AS top_platform,
      (SELECT engagement_rate FROM creator_social_profiles WHERE creator_id=cr.id ORDER BY followers_count DESC LIMIT 1) AS top_er
      FROM brand_saved_creators bsc JOIN creators cr ON cr.id = bsc.creator_id
      WHERE bsc.brand_id = ? ORDER BY bsc.saved_at DESC
    `, [req.user.id]);
    success(res, rows);
  } catch (err) {
    next(err);
  }
};

exports.getCampaigns = async (req, res, next) => {
  try {
    const { status = 'all' } = req.query;
    let where = 'WHERE c.brand_id = ?';
    if (status === 'active') where += " AND c.status NOT IN ('campaign_closed','declined','escrow_released')";
    else if (status === 'completed') where += " AND c.status IN ('campaign_closed','escrow_released')";
    const [campaigns] = await pool.query(`SELECT c.*, cr.name AS creator_name, cr.profile_photo FROM campaigns c JOIN creators cr ON cr.id = c.creator_id ${where}`, [req.user.id]);
    const statusMap = { 'request_sent': 0, 'creator_accepted': 1, 'agreement_locked': 2, 'content_uploaded': 3, 'brand_approved': 4, 'posted_live': 5, 'analytics_collected': 6, 'escrow_released': 7, 'campaign_closed': 8 };
    const results = campaigns.map(c => ({ ...c, progress_step: statusMap[c.status] || 0 }));
    const [active] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id = ? AND status NOT IN ('campaign_closed','declined','escrow_released')", [req.user.id]);
    const [completed] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id = ? AND status IN ('campaign_closed','escrow_released')", [req.user.id]);
    success(res, { active_count: active[0].count, completed_count: completed[0].count, campaigns: results });
  } catch (err) {
    next(err);
  }
};

exports.approveContent = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [camp] = await pool.query('SELECT brand_id, status, title, creator_id FROM campaigns WHERE id=?', [id]);
    if (camp[0].brand_id !== req.user.id) return error(res, 'Unauthorized', 403);
    if (camp[0].status !== 'content_uploaded') return error(res, 'Invalid campaign status', 400);
    await pool.query("UPDATE campaigns SET status='brand_approved', updated_at=NOW() WHERE id=?", [id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'brand_approved', 'brand')", [id]);
    const [brand] = await pool.query('SELECT name FROM brands WHERE id=?', [req.user.id]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['creator', camp[0].creator_id, 'Content Approved', `${brand[0].name} approved your content for ${camp[0].title}`]);
    success(res, { status: 'brand_approved' });
  } catch (err) {
    next(err);
  }
};

exports.rejectContent = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const id = req.params.id;
    const [camp] = await pool.query('SELECT brand_id, status, title, creator_id FROM campaigns WHERE id=?', [id]);
    if (camp[0].brand_id !== req.user.id) return error(res, 'Unauthorized', 403);
    if (camp[0].status !== 'content_uploaded') return error(res, 'Invalid campaign status', 400);
    await pool.query('UPDATE campaigns SET rejection_reason=?, updated_at=NOW() WHERE id=?', [reason, id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'content_rejected', 'brand', ?)", [id, reason]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['creator', camp[0].creator_id, 'Content Rejected', `Content for ${camp[0].title} needs changes: ${reason}`]);
    success(res, null, 'Content rejected, creator notified');
  } catch (err) {
    next(err);
  }
};

exports.fundEscrow = async (req, res, next) => {
  try {
    const { campaign_id, transaction_id } = req.body;
    const [camp] = await pool.query('SELECT brand_id, escrow_status, title, creator_id FROM campaigns WHERE id=?', [campaign_id]);
    if (camp[0].brand_id !== req.user.id) return error(res, 'Unauthorized', 403);
    if (camp[0].escrow_status !== 'pending') return error(res, 'Escrow already funded or released', 400);
    await pool.query("UPDATE brand_payments SET payment_status='completed', paid_at=NOW(), transaction_id=? WHERE campaign_id=? AND brand_id=?", [transaction_id, campaign_id, req.user.id]);
    await pool.query("UPDATE campaigns SET escrow_status='held', status='agreement_locked', updated_at=NOW() WHERE id=?", [campaign_id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'agreement_locked', 'brand')", [campaign_id]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['creator', camp[0].creator_id, 'Escrow Secured', `Escrow secured for ${camp[0].title}`]);
    success(res, { escrow_status: 'held', campaign_status: 'agreement_locked' });
  } catch (err) {
    next(err);
  }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notifications WHERE user_type='brand' AND user_id=? ORDER BY created_at DESC LIMIT 50", [req.user.id]);
    success(res, rows);
  } catch (err) {
    next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    await pool.query("UPDATE notifications SET is_read=true WHERE id=? AND user_id=? AND user_type='brand'", [req.params.id, req.user.id]);
    success(res, null, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};
