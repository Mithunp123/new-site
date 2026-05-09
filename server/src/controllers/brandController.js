const pool = require('../config/db');
const { success, created, error } = require('../helpers/response');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');
const { getInitials, getAvatarColor, formatINR, formatROI } = require('../helpers/format');
const { broadcastCampaignUpdate } = require('../websocket');
const { autoCollectMetrics } = require('./analyticsController');

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
    const [brand] = await pool.query(
      'SELECT id, name, email, phone, website, logo_url, category, description, company_size, country, role, is_active FROM brands WHERE id = ?',
      [brand_id]
    );
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
      SELECT c.creator_id, cr.name AS creator_name, c.budget AS amount, c.title AS campaign_title, c.status, c.negotiate_amount
      FROM campaigns c
      JOIN creators cr ON cr.id = c.creator_id
      WHERE c.brand_id = ? ORDER BY c.created_at DESC LIMIT 3
    `, [id]);

    const statusMap = { 'request_sent': 'Sent', 'creator_accepted': 'Pending', 'declined': 'Declined', 'negotiating': 'Negotiating' };
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
    let where = 'WHERE cr.is_active = true AND cr.is_verified = true AND (ig.id IS NOT NULL OR yt.id IS NOT NULL)';

    if (followers) {
      let min = 0, max = 999999999;
      if (followers === '1K-10K') { min = 1000; max = 10000; }
      else if (followers === '10K-100K') { min = 10000; max = 100000; }
      else if (followers === '100K-1M') { min = 100000; max = 1000000; }
      else if (followers === '1M+') { min = 1000000; }
      where += ' AND COALESCE(ig.followers_count, yt.followers_count) >= ? AND COALESCE(ig.followers_count, yt.followers_count) <= ?';
      params.push(min, max);
    }

    if (search) { where += ' AND (cr.name LIKE ? OR cr.display_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    if (niche) { where += ' AND JSON_CONTAINS(nd.categories, JSON_QUOTE(?))'; params.push(niche); }
    if (platform) { where += ' AND (ig.platform = ? OR yt.platform = ?)'; params.push(platform, platform); }
    if (min_er) { where += ' AND COALESCE(ig.engagement_rate, yt.engagement_rate) >= ?'; params.push(min_er); }
    if (location) { where += ' AND cr.location LIKE ?'; params.push(`%${location}%`); }
    if (language) { where += ' AND JSON_CONTAINS(cr.languages_known, JSON_QUOTE(?))'; params.push(language); }

    const query = `
      SELECT DISTINCT
        cr.id,
        cr.name,
        cr.display_name,
        cr.profile_photo,
        cr.location,
        cr.is_verified,
        UPPER(LEFT(cr.name, 2)) AS initials,
        nd.categories,
        nd.collaboration_preference,
        nd.sample_links,
        COALESCE(ig.platform, yt.platform) AS primary_platform,
        COALESCE(ig.followers_count, yt.followers_count) AS followers_count,
        ig.followers_count AS instagram_followers,
        ig.engagement_rate AS instagram_engagement_rate,
        ig.avg_views AS instagram_avg_views,
        yt.followers_count AS youtube_subscribers,
        yt.engagement_rate AS youtube_engagement_rate,
        yt.avg_views AS youtube_avg_views,
        COALESCE(ig.avg_views, yt.avg_views) AS avg_views,
        COALESCE(ig.engagement_rate, yt.engagement_rate) AS engagement_rate,
        COALESCE(ig.profile_url, yt.profile_url) AS primary_profile_url,
        CASE WHEN ig.id IS NOT NULL THEN true ELSE false END AS has_instagram,
        CASE WHEN yt.id IS NOT NULL THEN true ELSE false END AS has_youtube,
        CASE WHEN bsc.id IS NOT NULL THEN true ELSE false END AS is_saved
      FROM creators cr
      LEFT JOIN creator_niche_details nd ON nd.creator_id = cr.id
      LEFT JOIN creator_social_profiles ig ON ig.creator_id = cr.id AND ig.platform = 'instagram'
      LEFT JOIN creator_social_profiles yt ON yt.creator_id = cr.id AND yt.platform = 'youtube'
      LEFT JOIN brand_saved_creators bsc ON bsc.creator_id = cr.id AND bsc.brand_id = ?
      ${where}
      ORDER BY cr.is_verified DESC, COALESCE(ig.followers_count, yt.followers_count) DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT cr.id) AS count 
      FROM creators cr
      LEFT JOIN creator_niche_details nd ON nd.creator_id = cr.id
      LEFT JOIN creator_social_profiles ig ON ig.creator_id = cr.id AND ig.platform = 'instagram'
      LEFT JOIN creator_social_profiles yt ON yt.creator_id = cr.id AND yt.platform = 'youtube'
      ${where}
    `;

    const [creators] = await pool.query(query, [...params, parseInt(limit), parseInt(offset)]);
    const [countRow] = await pool.query(countQuery, params.slice(1));

    const results = creators.map(c => ({
      ...c,
      avatar_color: getAvatarColor(c.id),
      categories: typeof c.categories === 'string' ? JSON.parse(c.categories) : (c.categories || []),
      top_platform_stats: {
        followers_count: c.followers_count,
        engagement_rate: c.engagement_rate,
        avg_views: c.avg_views
      }
    }));

    success(res, { total: countRow[0].count, page: parseInt(page), limit: parseInt(limit), total_pages: Math.ceil(countRow[0].count / limit), creators: results });
  } catch (err) {
    next(err);
  }
};

// Collaboration Requests (NEW)
exports.sendCollaborationRequest = async (req, res, next) => {
  try {
    const { creator_id, campaign_name, campaign_goal, campaign_brief, platform, content_type, number_of_posts, start_date, end_date, respond_by, budget_offer, tracking_link, deliverables_required } = req.body;
    
    console.log('[Campaign] sendCollaborationRequest received body keys:', Object.keys(req.body));

    // Validations
    const requiredFields = [
      'creator_id', 'campaign_name', 'campaign_goal', 'campaign_brief', 
      'platform', 'content_type', 'number_of_posts', 'start_date', 
      'end_date', 'respond_by', 'budget_offer', 'deliverables_required'
    ];

    const missingFields = requiredFields.filter(field => {
      const val = req.body[field];
      return val === undefined || val === null || val === '';
    });

    if (missingFields.length > 0) {
      return error(res, `Missing required fields: ${missingFields.join(', ')}`, 400);
    }
    
    if (Number(budget_offer) <= 0) return error(res, 'Budget offer must be greater than 0', 400);
    
    // Robust date check
    const start = new Date(start_date);
    const end = new Date(end_date);
    if (end < start) return error(res, 'End date cannot be earlier than start date', 400);

    const [existingCampaigns] = await pool.query(`SELECT id FROM campaigns WHERE brand_id=? AND creator_id=? AND status NOT IN ('campaign_closed','declined')`, [req.user.id, creator_id]);
    if (existingCampaigns.length > 0) return error(res, 'You already have an active campaign with this creator', 400);

    const platform_fee_rate = parseFloat(process.env.PLATFORM_FEE_RATE) || 8.00;
    const budget = Number(budget_offer);
    const platform_fee = budget * (platform_fee_rate / 100);
    const total_to_escrow = budget + platform_fee;

    const [res_camp] = await pool.query(
      `INSERT INTO campaigns (brand_id, creator_id, title, campaign_goal, brief, platform, content_type, number_of_posts, start_date, deadline, respond_by, budget, escrow_amount, platform_fee, total_to_escrow, tracking_link, tracking_link_provided, deliverables_required, status, escrow_status, commission_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, creator_id, campaign_name, campaign_goal, campaign_brief, platform, content_type, number_of_posts, start_date, end_date, respond_by, budget, total_to_escrow, platform_fee, total_to_escrow, tracking_link, tracking_link ? true : false, deliverables_required, 'request_sent', 'pending', 10.00]
    );
    const campaign_id = res_camp.insertId;

    await pool.query('INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, ?, ?)', [campaign_id, 'request_sent', 'brand']);
    await pool.query('INSERT INTO brand_payments (brand_id, campaign_id, amount, payment_type, payment_status) VALUES (?, ?, ?, ?, ?)', [req.user.id, campaign_id, total_to_escrow, 'escrow', 'pending']);
    
    const [brandRows] = await pool.query('SELECT name FROM brands WHERE id=?', [req.user.id]);
    const brandName = brandRows[0]?.name || 'A Brand';
    
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['creator', creator_id, 'New Campaign Request', `${brandName} sent you a collaboration for "${campaign_name}"`]);

    res.status(201).json({
      success: true,
      data: {
        campaign_id,
        creator_id,
        budget_offer: budget,
        platform_fee,
        total_to_escrow,
        status: 'request_sent',
        message: 'Collaboration request sent successfully'
      }
    });
  } catch (err) {
    console.error('Error in sendCollaborationRequest:', err);
    next(err);
  }
};

exports.getCollaborationRequests = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [rows] = await pool.query(`
      SELECT c.id AS campaign_id, c.creator_id, cr.name AS creator_name, 
             c.budget AS original_budget, c.budget AS amount,
             c.title AS campaign_title, c.status,
             c.negotiate_amount, c.negotiate_message
      FROM campaigns c JOIN creators cr ON cr.id = c.creator_id
      WHERE c.brand_id = ? ORDER BY c.created_at DESC
    `, [id]);

    // Fetch negotiations for these campaigns
    const campaignIds = rows.map(r => r.campaign_id);
    let negotiations = [];
    if (campaignIds.length > 0) {
      const [negRows] = await pool.query(
        'SELECT * FROM campaign_negotiations WHERE campaign_id IN (?) ORDER BY created_at ASC',
        [campaignIds]
      );
      negotiations = negRows;
    }

    const requests = rows.map(r => ({
      ...r,
      creator_initials: getInitials(r.creator_name),
      avatar_color: getAvatarColor(r.creator_id),
      negotiations: negotiations.filter(n => n.campaign_id === r.campaign_id)
    }));

    const [pending] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id=? AND status='creator_accepted'", [id]);
    const [collabed] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id=? AND status NOT IN ('request_sent','declined','creator_accepted')", [id]);
    const [sent] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE brand_id=? AND status='request_sent'", [id]);

    success(res, { pending_count: pending[0].count, accepted_count: pending[0].count, collabed_count: collabed[0].count, sent_count: sent[0].count, requests });
  } catch (err) {
    next(err);
  }
};

// Campaign Tracking (NEW)
exports.getCampaignTracking = async (req, res, next) => {
  try {
    const id = req.user.id;

    // Only show active campaigns — exclude closed/declined/released
    const [qfeatured] = await pool.query(`
      SELECT c.id, c.title, c.status, c.content_url, cr.name AS creator_name
      FROM campaigns c JOIN creators cr ON cr.id = c.creator_id
      WHERE c.brand_id = ?
        AND c.status NOT IN ('declined', 'campaign_closed', 'escrow_released')
      ORDER BY
        CASE c.status
          WHEN 'content_uploaded'    THEN 1
          WHEN 'creator_accepted'    THEN 2
          WHEN 'brand_approved'      THEN 3
          WHEN 'posted_live'         THEN 4
          WHEN 'analytics_collected' THEN 5
          WHEN 'negotiating'         THEN 6
          WHEN 'agreement_locked'    THEN 7
          ELSE 8
        END ASC,
        c.updated_at DESC
      LIMIT 1
    `, [id]);

    const statusMap = {
      'request_sent': 0, 'creator_accepted': 1, 'agreement_locked': 2,
      'content_uploaded': 3, 'brand_approved': 4, 'posted_live': 5,
      'analytics_collected': 6, 'escrow_released': 7, 'campaign_closed': 8
    };
    
    let featured = null;
    if (qfeatured.length) {
      const f = qfeatured[0];
      featured = {
        ...f,
        progress_step: statusMap[f.status] ?? 0,
        // action_required kept for legacy but dynamic banner now handles this on frontend
        action_required: f.status === 'content_uploaded' ? {
          message: `Content submitted by ${f.creator_name} — Awaiting your approval`,
          can_approve: true,
          can_reject: true
        } : null
      };
    }

    // Only show active campaigns in the table — exclude closed/declined/released
    const [qall] = await pool.query(`
      SELECT c.id, c.title, c.status, c.escrow_amount AS spend, ca.reach, ca.views, ca.engagement_rate,
             rt.roi_percentage, c.escrow_status,
             (SELECT COUNT(*) FROM campaigns c2 WHERE c2.title = c.title AND c2.brand_id = c.brand_id) AS creators_count,
             (SELECT COUNT(*) FROM campaign_analytics ca2 WHERE ca2.campaign_id = c.id) AS content_links_count
      FROM campaigns c
      LEFT JOIN campaign_analytics ca ON ca.campaign_id = c.id
      LEFT JOIN roi_tracking rt ON rt.campaign_id = c.id
      WHERE c.brand_id = ?
        AND c.status NOT IN ('declined', 'campaign_closed', 'escrow_released')
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
    const id = req.params.campaignId;
    const brand_id = req.user.id;

    const [camp] = await pool.query('SELECT * FROM campaigns WHERE id = ? AND brand_id = ?', [id, brand_id]);
    if (!camp.length) return error(res, 'Campaign not found', 404);
    if (camp[0].status !== 'content_uploaded') return error(res, 'No content to approve', 400);

    // Set status to brand_approved — brand must then click "Go Live" to proceed
    await pool.query("UPDATE campaigns SET status='brand_approved', updated_at=NOW() WHERE id=? AND brand_id=?", [id, brand_id]);
    await pool.query(`
      UPDATE content_submissions SET status='approved', reviewed_at=NOW()
      WHERE campaign_id=? AND id = (SELECT max_id FROM (SELECT MAX(id) AS max_id FROM content_submissions WHERE campaign_id=?) AS tmp)
    `, [id, id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'brand_approved', 'brand')", [id]);

    const [brand] = await pool.query('SELECT name FROM brands WHERE id=?', [brand_id]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)',
      ['creator', camp[0].creator_id, 'Content Approved', `${brand[0].name} approved your content for "${camp[0].title}". Waiting for brand to go live.`]);

    broadcastCampaignUpdate(id, { status: 'brand_approved', progress_step: 4 });
    success(res, { status: 'brand_approved', message: 'Content approved. Click Go Live to release payment and close the campaign.' });
  } catch (err) {
    next(err);
  }
};

exports.requestRevision = async (req, res, next) => {
  try {
    const { revision_note } = req.body;
    const id = req.params.campaignId;
    const brand_id = req.user.id;

    const [camp] = await pool.query('SELECT * FROM campaigns WHERE id = ? AND brand_id = ?', [id, brand_id]);
    if (!camp.length) return error(res, 'Campaign not found', 404);
    if (camp[0].status !== 'content_uploaded') return error(res, 'No content to request revision for', 400);

    await pool.query(`
      UPDATE content_submissions SET status='revision_requested', rejection_note=?, reviewed_at=NOW()
      WHERE campaign_id=? AND id = (SELECT max_id FROM (SELECT MAX(id) AS max_id FROM content_submissions WHERE campaign_id=?) AS tmp)
    `, [revision_note, id, id]);

    // Set campaign status to revision_requested so creator sees the correction note
    await pool.query(
      "UPDATE campaigns SET status = 'revision_requested', brand_rejection_reason = ?, updated_at = NOW() WHERE id = ?",
      [revision_note, id]
    );

    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'revision_requested', 'brand', ?)", [id, 'Brand requested revision: ' + revision_note]);

    const [brand] = await pool.query('SELECT name FROM brands WHERE id=?', [brand_id]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['creator', camp[0].creator_id, 'Revision Requested', `${brand[0].name} requested changes to your content for "${camp[0].title}": ${revision_note}`]);

    broadcastCampaignUpdate(id, { status: 'revision_requested' });
    success(res, { message: 'Revision requested', revision_note });
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
    broadcastCampaignUpdate(campaign_id, { status: 'agreement_locked', progress_step: 2, escrow_status: 'held' });
    success(res, { escrow_status: 'held', campaign_status: 'agreement_locked' });
  } catch (err) {
    next(err);
  }
};

exports.markCampaignLive = async (req, res, next) => {
  try {
    const id = req.params.campaignId;
    const brand_id = req.user.id;
    const [camp] = await pool.query('SELECT * FROM campaigns WHERE id=? AND brand_id=?', [id, brand_id]);
    if (!camp.length) return error(res, 'Campaign not found', 404);
    if (camp[0].status !== 'brand_approved') return error(res, 'Content must be approved before marking live', 400);

    await pool.query("UPDATE campaigns SET status='posted_live', updated_at=NOW() WHERE id=?", [id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'posted_live', 'brand')", [id]);
    await pool.query(
      "INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Campaign Live! 🚀', ?)",
      [camp[0].creator_id, `Your content for "${camp[0].title}" is now live! Metrics will be collected automatically.`]
    );

    broadcastCampaignUpdate(id, { status: 'posted_live', progress_step: 5 });

    // Auto-collect metrics after 30 seconds (allows YouTube/Instagram to index the post)
    // In production this delay can be longer (e.g. 1 hour) for accurate data
    setTimeout(() => autoCollectMetrics(id, brand_id), 30000);

    success(res, { status: 'posted_live', message: 'Campaign marked live. Metrics will be auto-collected in ~30 seconds.' });
  } catch (err) { next(err); }
};

exports.releasePayment = async (req, res, next) => {
  try {
    const id = req.params.campaignId;
    const brand_id = req.user.id;
    const [camp] = await pool.query('SELECT * FROM campaigns WHERE id=? AND brand_id=?', [id, brand_id]);
    if (!camp.length) return error(res, 'Campaign not found', 404);
    const releasableStatuses = ['posted_live', 'analytics_collected'];
    if (!releasableStatuses.includes(camp[0].status)) return error(res, 'Campaign not ready for payment release', 400);

    // Step 1: Release escrow
    await pool.query("UPDATE campaigns SET status='escrow_released', escrow_status='released', updated_at=NOW() WHERE id=?", [id]);
    await pool.query("UPDATE brand_payments SET payment_status='released' WHERE campaign_id=? AND brand_id=?", [id, brand_id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'escrow_released', 'brand')", [id]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)',
      ['creator', camp[0].creator_id, 'Payment Released! 💰', `Payment for "${camp[0].title}" has been released to your account.`]);

    broadcastCampaignUpdate(id, { status: 'escrow_released', progress_step: 7, escrow_status: 'released' });

    // Step 2: Auto-close campaign after 3 seconds
    setTimeout(async () => {
      try {
        const [current] = await pool.query('SELECT status FROM campaigns WHERE id=?', [id]);
        if (current[0]?.status === 'escrow_released') {
          await pool.query("UPDATE campaigns SET status='campaign_closed', updated_at=NOW() WHERE id=?", [id]);
          await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'campaign_closed', 'system')", [id]);
          broadcastCampaignUpdate(id, { status: 'campaign_closed', progress_step: 8 });
          console.log(`[Campaign] Campaign ${id} auto-closed after payment release`);
        }
      } catch (e) {
        console.error(`[Campaign] Auto-close failed for campaign ${id}:`, e.message);
      }
    }, 3000);

    success(res, { status: 'escrow_released', message: 'Payment released. Campaign will close automatically.' });
  } catch (err) { next(err); }
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

exports.createCampaign = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const brand_id = req.user.id;
    const {
      group_title, campaign_goal, brief, platform,
      content_type, number_of_posts, start_date,
      end_date, respond_by, budget_per_creator,
      tracking_link, deliverables_required,
      targeting_type, creator_ids,
      target_niches, target_platforms,
      target_min_followers, target_max_followers,
      target_min_er, target_location
    } = req.body;

    if (!group_title || !brief || !platform || !budget_per_creator || !end_date) {
      await conn.rollback();
      return error(res, 'Missing required fields', 400);
    }

    const platform_fee_rate = 8.00;
    const platform_fee = budget_per_creator * (platform_fee_rate / 100);
    const total_to_escrow = budget_per_creator + platform_fee;

    const [groupResult] = await conn.query(
      `INSERT INTO campaign_groups
       (brand_id, group_title, campaign_goal, brief, platform,
        content_type, number_of_posts, start_date, end_date,
        respond_by, budget_per_creator, platform_fee_rate,
        tracking_link, deliverables_required, targeting_type,
        target_niches, target_platforms, target_min_followers,
        target_max_followers, target_min_er, target_location)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        brand_id, group_title, campaign_goal, brief, platform,
        content_type, number_of_posts, start_date, end_date,
        respond_by, budget_per_creator, platform_fee_rate,
        tracking_link, deliverables_required, targeting_type,
        JSON.stringify(target_niches || []),
        JSON.stringify(target_platforms || []),
        target_min_followers || 0,
        target_max_followers || 0,
        target_min_er || 0,
        target_location || null
      ]
    );
    const campaign_group_id = groupResult.insertId;

    let targetCreatorIds = [];

    if (targeting_type === 'specific') {
      if (!creator_ids || !creator_ids.length) {
        await conn.rollback();
        return error(res, 'creator_ids required for specific targeting', 400);
      }
      const placeholders = creator_ids.map(() => '?').join(',');
      const [validCreators] = await conn.query(
        `SELECT id FROM creators WHERE id IN (${placeholders}) AND is_active = true`,
        creator_ids
      );
      targetCreatorIds = validCreators.map(c => c.id);

    } else if (targeting_type === 'category') {
      let matchQuery = `
        SELECT DISTINCT cr.id
        FROM creators cr
        JOIN creator_social_profiles sp ON sp.creator_id = cr.id
        LEFT JOIN creator_niche_details nd ON nd.creator_id = cr.id
        WHERE cr.is_active = true AND cr.is_verified = true
      `;
      const matchParams = [];

      if (target_niches && target_niches.length) {
        const nicheConditions = target_niches.map(() => `JSON_CONTAINS(nd.categories, JSON_QUOTE(?))`).join(' OR ');
        matchQuery += ` AND (${nicheConditions})`;
        matchParams.push(...target_niches);
      }

      if (platform) {
        matchQuery += ` AND sp.platform = ?`;
        matchParams.push(platform);
      }

      if (target_min_followers) {
        matchQuery += ` AND sp.followers_count >= ?`;
        matchParams.push(target_min_followers);
      }

      if (target_max_followers) {
        matchQuery += ` AND sp.followers_count <= ?`;
        matchParams.push(target_max_followers);
      }

      if (target_min_er) {
        matchQuery += ` AND sp.engagement_rate >= ?`;
        matchParams.push(target_min_er);
      }

      if (target_location) {
        matchQuery += ` AND cr.location LIKE ?`;
        matchParams.push(`%${target_location}%`);
      }

      matchQuery += `
        AND cr.id NOT IN (
          SELECT creator_id FROM campaigns
          WHERE brand_id = ? AND status NOT IN ('campaign_closed','declined')
        )
      `;
      matchParams.push(brand_id);

      const [matchedCreators] = await conn.query(matchQuery, matchParams);
      targetCreatorIds = matchedCreators.map(c => c.id);
    }

    if (!targetCreatorIds.length) {
      await conn.rollback();
      return error(res, 'No eligible creators found for this campaign', 404);
    }

    const campaignRows = [];
    const [brandRow] = await conn.query(`SELECT name FROM brands WHERE id = ?`, [brand_id]);

    for (const creator_id of targetCreatorIds) {
      const [campResult] = await conn.query(
        `INSERT INTO campaigns
         (brand_id, creator_id, campaign_group_id, title,
          campaign_goal, deliverable, brief, platform,
          content_type, number_of_posts, start_date,
          deadline, respond_by, budget, escrow_amount,
          platform_fee, total_to_escrow, tracking_link,
          tracking_link_provided, deliverables_required,
          targeting_type, target_niches,
          status, escrow_status, commission_rate)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          brand_id, creator_id, campaign_group_id, group_title, campaign_goal,
          number_of_posts, brief, platform, content_type, number_of_posts, start_date,
          end_date, respond_by, budget_per_creator, total_to_escrow, platform_fee,
          total_to_escrow, tracking_link || null, tracking_link ? true : false,
          deliverables_required, targeting_type, JSON.stringify(target_niches || []),
          'request_sent', 'pending', 10.00
        ]
      );

      await conn.query(
        `INSERT INTO campaign_timeline (campaign_id, status, changed_by, note)
         VALUES (?, 'request_sent', 'brand', 'Campaign request sent by brand')`,
        [campResult.insertId]
      );

      await conn.query(
        `INSERT INTO brand_payments (brand_id, campaign_id, amount, payment_type, payment_status)
         VALUES (?, ?, ?, 'escrow', 'pending')`,
        [brand_id, campResult.insertId, total_to_escrow]
      );

      await conn.query(
        `INSERT INTO notifications (user_type, user_id, title, message)
         VALUES ('creator', ?, ?, ?)`,
        [creator_id, 'New Campaign Request', `${brandRow[0].name} sent you a collaboration request for "${group_title}"`]
      );

      campaignRows.push({ campaign_id: campResult.insertId, creator_id });
    }

    await conn.query(`UPDATE campaign_groups SET total_creators_targeted = ? WHERE id = ?`, [targetCreatorIds.length, campaign_group_id]);

    await conn.commitTransaction();

    return created(res, {
      campaign_group_id, targeting_type, total_creators_targeted: targetCreatorIds.length,
      budget_per_creator, platform_fee, total_to_escrow, campaigns: campaignRows
    }, 'Campaign created and requests sent');

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

exports.getMatchedCreators = async (req, res, next) => {
  try {
    const brand_id = req.user.id;
    const { target_niches, platform, target_min_followers, target_max_followers, target_min_er, target_location } = req.query;
    
    let matchQuery = `
      SELECT DISTINCT cr.id, cr.name, cr.display_name, cr.profile_photo,
        cr.location, cr.is_verified, sp.platform AS top_platform, sp.followers_count, sp.avg_views, sp.engagement_rate, nd.categories
      FROM creators cr
      JOIN creator_social_profiles sp ON sp.creator_id = cr.id
      LEFT JOIN creator_niche_details nd ON nd.creator_id = cr.id
      WHERE cr.is_active = true AND cr.is_verified = true
    `;
    const matchParams = [];

    if (target_niches) {
      const niches = Array.isArray(target_niches) ? target_niches : target_niches.split(',');
      const nicheConditions = niches.map(() => `JSON_CONTAINS(nd.categories, JSON_QUOTE(?))`).join(' OR ');
      matchQuery += ` AND (${nicheConditions})`;
      matchParams.push(...niches);
    }

    if (platform) {
      matchQuery += ` AND sp.platform = ?`;
      matchParams.push(platform);
    }
    if (target_min_followers) {
      matchQuery += ` AND sp.followers_count >= ?`;
      matchParams.push(target_min_followers);
    }
    if (target_max_followers) {
      matchQuery += ` AND sp.followers_count <= ?`;
      matchParams.push(target_max_followers);
    }
    if (target_min_er) {
      matchQuery += ` AND sp.engagement_rate >= ?`;
      matchParams.push(target_min_er);
    }
    if (target_location) {
      matchQuery += ` AND cr.location LIKE ?`;
      matchParams.push(`%${target_location}%`);
    }

    matchQuery += `
      AND cr.id NOT IN (
        SELECT creator_id FROM campaigns WHERE brand_id = ? AND status NOT IN ('campaign_closed','declined')
      )
    `;
    matchParams.push(brand_id);

    const [matchedCreators] = await pool.query(matchQuery, matchParams);

    const creators = matchedCreators.map(c => ({
      ...c,
      categories: typeof c.categories === 'string' ? JSON.parse(c.categories) : (c.categories || [])
    }));

    success(res, { total_matched: creators.length, creators });
  } catch (err) {
    next(err);
  }
};

exports.getCampaignGroups = async (req, res, next) => {
  try {
    const brand_id = req.user.id;
    const [groups] = await pool.query(`
      SELECT
        cg.id, cg.group_title, cg.platform, cg.campaign_goal, cg.budget_per_creator,
        cg.total_creators_targeted, cg.total_creators_accepted, cg.status, cg.created_at, cg.end_date,
        b.name AS brand_name,
        COUNT(c.id) AS total_campaigns,
        SUM(CASE WHEN c.status = 'request_sent' THEN 1 ELSE 0 END) AS pending_count,
        SUM(CASE WHEN c.status IN (
          'creator_accepted','agreement_locked','content_uploaded',
          'brand_approved','posted_live','analytics_collected'
        ) THEN 1 ELSE 0 END) AS active_count,
        SUM(CASE WHEN c.status IN ('campaign_closed','escrow_released') THEN 1 ELSE 0 END) AS completed_count,
        SUM(c.total_to_escrow) AS total_budget_committed
      FROM campaign_groups cg
      JOIN brands b ON b.id = cg.brand_id
      LEFT JOIN campaigns c ON c.campaign_group_id = cg.id
      WHERE cg.brand_id = ?
      GROUP BY cg.id
      ORDER BY cg.created_at DESC
    `, [brand_id]);

    success(res, { groups });
  } catch (err) {
    next(err);
  }
};

exports.getCampaignGroupDetails = async (req, res, next) => {
  try {
    const brand_id = req.user.id;
    const groupId = req.params.groupId;

    const [groupResult] = await pool.query(`
      SELECT cg.*, b.name AS brand_name, b.logo_url AS brand_logo
      FROM campaign_groups cg
      JOIN brands b ON b.id = cg.brand_id
      WHERE cg.id = ? AND cg.brand_id = ?
    `, [groupId, brand_id]);

    if (!groupResult.length) return error(res, 'Campaign group not found', 404);

    const [campaignsResult] = await pool.query(`
      SELECT
        c.id, c.creator_id, c.status, c.escrow_status,
        c.budget, c.total_to_escrow, c.content_url,
        c.created_at, c.updated_at,
        cr.name AS creator_name, cr.display_name AS creator_handle,
        cr.profile_photo AS creator_photo, cr.location AS creator_location,
        cr.is_verified AS creator_verified,
        (SELECT platform FROM creator_social_profiles WHERE creator_id = cr.id ORDER BY followers_count DESC LIMIT 1) AS top_platform,
        (SELECT followers_count FROM creator_social_profiles WHERE creator_id = cr.id ORDER BY followers_count DESC LIMIT 1) AS followers_count,
        (SELECT engagement_rate FROM creator_social_profiles WHERE creator_id = cr.id ORDER BY followers_count DESC LIMIT 1) AS engagement_rate,
        ca.views, ca.reach, ca.clicks, ca.sales_generated
      FROM campaigns c
      JOIN creators cr ON cr.id = c.creator_id
      LEFT JOIN campaign_analytics ca ON ca.campaign_id = c.id
      WHERE c.campaign_group_id = ?
      ORDER BY c.created_at ASC
    `, [groupId]);

    const statusMap = { 'request_sent': 0, 'creator_accepted': 1, 'agreement_locked': 2, 'content_uploaded': 3, 'brand_approved': 4, 'posted_live': 5, 'analytics_collected': 6, 'escrow_released': 7, 'campaign_closed': 8 };

    const campaigns = campaignsResult.map(c => ({
      ...c, progress_step: statusMap[c.status] || 0
    }));

    success(res, { group: groupResult[0], campaigns });
  } catch (err) {
    next(err);
  }
};

exports.getCampaignSubmissions = async (req, res, next) => {
  try {
    const brand_id = req.user.id;
    const campaignId = req.params.campaignId;

    const [camp] = await pool.query('SELECT id FROM campaigns WHERE id = ? AND brand_id = ?', [campaignId, brand_id]);
    if (!camp.length) return error(res, 'Campaign not found', 404);

    const [submissions] = await pool.query(`
      SELECT
        cs.id, cs.file_path, cs.file_name, cs.file_size,
        cs.file_type, cs.caption, cs.submission_note,
        cs.version, cs.status, cs.rejection_note,
        cs.submitted_at, cs.reviewed_at,
        cr.name AS creator_name, cr.profile_photo AS creator_photo
      FROM content_submissions cs
      JOIN creators cr ON cr.id = cs.creator_id
      WHERE cs.campaign_id = ?
      ORDER BY cs.version DESC
    `, [campaignId]);

    success(res, { submissions });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/brand/campaign/:campaignId/go-live
 * Atomic action: approve content → post live → release escrow → close campaign → create earnings.
 */
exports.goLive = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const campaignId = req.params.campaignId;
    const brand_id = req.user.id;

    const [camps] = await conn.query('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
    if (!camps.length) { conn.release(); return error(res, 'Campaign not found', 404); }
    const camp = camps[0];

    if (camp.brand_id !== brand_id) { conn.release(); return error(res, 'Forbidden', 403); }
    // Accept both content_uploaded (direct go-live) and brand_approved (after approve step)
    if (!['content_uploaded', 'brand_approved'].includes(camp.status)) {
      conn.release();
      return error(res, 'Campaign must be in content_uploaded or brand_approved status to go live', 400);
    }

    await conn.beginTransaction();

    // Step 1: posted_live
    await conn.query("UPDATE campaigns SET status = 'posted_live', updated_at = NOW() WHERE id = ?", [campaignId]);

    // Step 2: release escrow + close campaign
    await conn.query(
      "UPDATE campaigns SET escrow_status = 'released', status = 'campaign_closed', updated_at = NOW() WHERE id = ?",
      [campaignId]
    );

    // Step 3: compute net_amount and upsert earnings
    const commissionRate = Number(camp.commission_rate) || 10;
    const budget = Number(camp.budget) || 0;
    const commissionAmt = budget * (commissionRate / 100);
    const netAmount = budget - commissionAmt;

    await conn.query(
      `INSERT INTO earnings (creator_id, campaign_id, gross_amount, commission_rate, commission_amt, net_amount, payment_status, released_at)
       VALUES (?, ?, ?, ?, ?, ?, 'released', NOW())
       ON DUPLICATE KEY UPDATE payment_status = 'released', released_at = NOW(), net_amount = ?`,
      [camp.creator_id, campaignId, budget, commissionRate, commissionAmt, netAmount, netAmount]
    );

    // Step 4: timeline
    await conn.query(
      "INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'campaign_closed', 'brand', 'Go Live — payment released')",
      [campaignId]
    );

    // Step 5: notify creator
    await conn.query(
      'INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)',
      ['creator', camp.creator_id, 'Payment Released', `Your payment of ₹${netAmount.toFixed(2)} has been released. Campaign "${camp.title}" closed.`]
    );

    await conn.commit();
    conn.release();

    broadcastCampaignUpdate(campaignId, { status: 'campaign_closed' });

    success(res, { status: 'campaign_closed', net_amount: netAmount });
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    conn.release();
    next(err);
  }
};

/**
 * GET /api/brand/metrics
 * Fetch live metrics from YouTube Data API v3 + YouTube Analytics API + Instagram Lens API.
 *
 * YouTube Data API v3 (youtube_date_key):
 *   - Views, likes, comments, subscribers, video title, duration, upload date, thumbnail
 *
 * YouTube Analytics API (youtube_analytics_key):
 *   - Watch time, CTR, audience retention, traffic sources, revenue (if monetised)
 *   NOTE: Analytics API requires OAuth — if not available, we skip gracefully.
 *
 * Instagram Lens (INSTAGRAM_LENS_KEY via instagram-lens.p.rapidapi.com):
 *   - Views/plays, likes, comments, shares, saves, engagement rate
 */
exports.getLiveMetrics = async (req, res, next) => {
  try {
    const brand_id = req.user.id;
    const axios = require('axios');

    // Fetch all live/closed campaigns for this brand
    const [campaigns] = await pool.query(
      `SELECT c.id, c.title, c.status, c.budget, c.platform AS campaign_platform,
              cr.name AS creator_name
       FROM campaigns c
       JOIN creators cr ON cr.id = c.creator_id
       WHERE c.brand_id = ? AND c.status IN ('posted_live', 'campaign_closed')
       ORDER BY c.updated_at DESC`,
      [brand_id]
    );

    const results = [];

    for (const camp of campaigns) {
      // Fetch content submissions for this campaign
      const [subs] = await pool.query(
        `SELECT id, platform, content_url, file_path
         FROM content_submissions
         WHERE campaign_id = ? AND (content_url IS NOT NULL OR file_path IS NOT NULL)
         ORDER BY submitted_at DESC`,
        [camp.id]
      );

      const submissionsWithStats = [];

      for (const sub of subs) {
        const url = sub.content_url || sub.file_path || '';
        const platform = (sub.platform || detectPlatform(url)).toLowerCase();
        let stats = null;

        // ── YouTube ──────────────────────────────────────────────────────
        if (platform === 'youtube') {
          const videoId = extractYTVideoId(url);
          if (!videoId) {
            stats = { error: 'Could not extract YouTube video ID from URL' };
          } else {
            try {
              // 1. YouTube Data API v3 — video statistics + snippet
              const ytDataRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                  part: 'statistics,snippet,contentDetails',
                  id: videoId,
                  key: process.env.youtube_date_key
                },
                timeout: 10000
              });

              const item = ytDataRes.data?.items?.[0];
              if (!item) {
                stats = { error: 'YouTube video not found or is private' };
              } else {
                const s = item.statistics;
                const snippet = item.snippet;
                const contentDetails = item.contentDetails;

                const views       = Number(s.viewCount    || 0);
                const likes       = Number(s.likeCount    || 0);
                const comments    = Number(s.commentCount || 0);
                const subscribers = Number(s.subscriberCount || 0);
                const engRate     = views > 0 ? parseFloat(((likes + comments) / views * 100).toFixed(2)) : 0;

                // Parse ISO 8601 duration (PT4M13S → "4:13")
                const duration = parseDuration(contentDetails?.duration);

                stats = {
                  platform: 'youtube',
                  // Data API v3 — real data
                  views,
                  likes,
                  comments,
                  subscribers,
                  engagement_rate: engRate,
                  video_title:    snippet?.title || null,
                  channel_name:   snippet?.channelTitle || null,
                  upload_date:    snippet?.publishedAt ? snippet.publishedAt.split('T')[0] : null,
                  thumbnail:      snippet?.thumbnails?.medium?.url || snippet?.thumbnails?.default?.url || null,
                  duration,
                  video_url:      url,
                  // Analytics API fields — fetched below if key available
                  watch_time_minutes: null,
                  avg_view_duration:  null,
                  ctr:                null,
                  impressions:        null,
                  traffic_sources:    null,
                  data_source: 'youtube_data_api_v3',
                };

                // 2. YouTube Analytics API — watch time, CTR, impressions, traffic sources
                // NOTE: Analytics API requires OAuth 2.0 for channel-level data.
                // We use the API key for public video-level analytics where available.
                if (process.env.youtube_analytics_key) {
                  try {
                    const today = new Date().toISOString().split('T')[0];
                    const startDate = snippet?.publishedAt
                      ? snippet.publishedAt.split('T')[0]
                      : '2020-01-01';

                    const ytAnalyticsRes = await axios.get('https://youtubeanalytics.googleapis.com/v2/reports', {
                      params: {
                        ids:        'channel==MINE',
                        startDate,
                        endDate:    today,
                        metrics:    'estimatedMinutesWatched,averageViewDuration,impressions,impressionClickThroughRate',
                        filters:    `video==${videoId}`,
                        key:        process.env.youtube_analytics_key,
                      },
                      timeout: 10000
                    });

                    const rows = ytAnalyticsRes.data?.rows?.[0];
                    if (rows) {
                      stats.watch_time_minutes = Math.round(rows[0] || 0);
                      stats.avg_view_duration  = Math.round(rows[1] || 0); // seconds
                      stats.impressions        = Math.round(rows[2] || 0);
                      stats.ctr                = rows[3] ? parseFloat((rows[3] * 100).toFixed(2)) : null; // as %
                      stats.data_source        = 'youtube_data_api_v3+analytics';
                    }
                  } catch (analyticsErr) {
                    // Analytics API requires OAuth — silently skip, Data API stats still shown
                    console.log(`[Metrics] YouTube Analytics API skipped for video ${videoId}: ${analyticsErr.message}`);
                  }
                }
              }
            } catch (e) {
              console.error(`[Metrics] YouTube Data API failed for ${url}:`, e.message);
              stats = { error: 'YouTube data unavailable — API error or timeout' };
            }
          }
        }

        // ── Instagram ─────────────────────────────────────────────────────
        else if (platform === 'instagram') {
          const postUrl = normaliseInstagramUrl(url);
          if (!postUrl) {
            stats = { error: 'Could not parse Instagram post URL' };
          } else {
            try {
              const igRes = await axios.request({
                method: 'POST',
                url: 'https://instagram-lens.p.rapidapi.com/post',
                headers: {
                  'x-rapidapi-key':  process.env.INSTAGRAM_LENS_KEY || process.env.RAPIDAPI_KEY,
                  'x-rapidapi-host': 'instagram-lens.p.rapidapi.com',
                  'Content-Type':    'application/json',
                },
                data:    { postUrl },
                timeout: 15000,
              });

              const d = igRes.data;

              // Instagram Lens returns different shapes — handle both
              const views    = Number(d?.video_view_count || d?.play_count || d?.views || 0);
              const likes    = Number(d?.like_count || d?.likes || d?.edge_media_preview_like?.count || 0);
              const comments = Number(d?.comment_count || d?.comments || d?.edge_media_to_comment?.count || 0);
              const shares   = Number(d?.share_count || d?.shares || 0);
              const saves    = Number(d?.save_count  || d?.saves  || 0);

              const base     = views > 0 ? views : likes * 10;
              const engRate  = base > 0
                ? parseFloat(((likes + comments + shares + saves) / base * 100).toFixed(2))
                : 0;

              // Caption / description
              const caption  = d?.caption || d?.edge_media_to_caption?.edges?.[0]?.node?.text || null;
              const postType = d?.product_type || d?.media_type || (views > 0 ? 'reel' : 'post');
              const postDate = d?.taken_at_timestamp
                ? new Date(d.taken_at_timestamp * 1000).toISOString().split('T')[0]
                : (d?.timestamp ? d.timestamp.split('T')[0] : null);

              if (views === 0 && likes === 0 && comments === 0) {
                stats = { error: 'Instagram data unavailable — post may be private or API returned empty data' };
              } else {
                stats = {
                  platform:        'instagram',
                  views,
                  likes,
                  comments,
                  shares,
                  saves,
                  engagement_rate: engRate,
                  post_type:       postType,
                  post_date:       postDate,
                  caption:         caption ? caption.substring(0, 200) : null,
                  post_url:        postUrl,
                  data_source:     'instagram_lens_api',
                };
              }
            } catch (e) {
              console.error(`[Metrics] Instagram Lens API failed for ${url}:`, e.message);
              stats = { error: 'Instagram data unavailable — API error or timeout' };
            }
          }
        }

        // ── Unknown platform ──────────────────────────────────────────────
        else {
          stats = { error: `Unsupported platform: ${platform || 'unknown'}` };
        }

        submissionsWithStats.push({
          platform: sub.platform || platform,
          content_url: url,
          stats,
        });
      }

      results.push({
        campaign_id:    camp.id,
        title:          camp.title,
        status:         camp.status,
        budget:         camp.budget,
        creator_name:   camp.creator_name,
        submissions:    submissionsWithStats,
      });
    }

    success(res, results);
  } catch (err) {
    next(err);
  }
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractYTVideoId(url) {
  if (!url) return null;
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function normaliseInstagramUrl(url) {
  if (!url) return null;
  // Ensure it's a full URL
  if (!url.startsWith('http')) url = 'https://' + url;
  // Strip query params and trailing slash for cleaner URL
  try {
    const u = new URL(url);
    return `${u.origin}${u.pathname.replace(/\/$/, '')}`;
  } catch {
    return url;
  }
}

function detectPlatform(url) {
  if (!url) return 'unknown';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('instagram.com')) return 'instagram';
  return 'unknown';
}

function parseDuration(iso) {
  if (!iso) return null;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || 0);
  const min = parseInt(m[2] || 0);
  const sec = parseInt(m[3] || 0);
  if (h > 0) return `${h}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${min}:${String(sec).padStart(2, '0')}`;
}
