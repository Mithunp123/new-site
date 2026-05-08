const pool = require('../config/db');
const { success, error } = require('../helpers/response');
const { broadcastCampaignUpdate } = require('../websocket');
const { autoCollectMetrics } = require('./analyticsController');

// Dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const [q1] = await pool.query('SELECT COUNT(*) AS total FROM creators');
    const [q2] = await pool.query('SELECT COUNT(*) AS total FROM creators WHERE is_verified=true');
    const [q3] = await pool.query('SELECT COUNT(*) AS total FROM creators WHERE is_verified=false AND is_active=true');
    const [q4] = await pool.query('SELECT COUNT(*) AS total FROM brands');
    const [q5] = await pool.query("SELECT COUNT(*) AS total FROM campaigns WHERE status NOT IN ('campaign_closed','declined')");
    const [q6] = await pool.query("SELECT COALESCE(SUM(amount),0) AS total FROM brand_payments WHERE payment_status='completed'");
    const [q7] = await pool.query('SELECT COALESCE(SUM(commission_amount),0) AS total FROM commissions WHERE MONTH(processed_at)=MONTH(NOW()) AND YEAR(processed_at)=YEAR(NOW())');
    const [q8] = await pool.query("SELECT COALESCE(SUM(escrow_amount),0) AS total FROM campaigns WHERE escrow_status='held'");
    const [q9] = await pool.query("SELECT COUNT(*) AS total FROM disputes WHERE status='open'");
    const [q9b] = await pool.query("SELECT COUNT(*) AS total FROM disputes WHERE status='resolved'");
    const [q5b] = await pool.query("SELECT COUNT(*) AS total FROM campaigns WHERE status='campaign_closed'");
    const [q1b] = await pool.query("SELECT COUNT(*) AS total FROM creators WHERE is_active=false");
    
    const [q10c] = await pool.query("SELECT DATE_FORMAT(created_at, '%b') AS month, COUNT(*) AS count FROM creators GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b') ORDER BY MAX(created_at) DESC LIMIT 6");
    const [q10b] = await pool.query("SELECT DATE_FORMAT(created_at, '%b') AS month, COUNT(*) AS count FROM brands GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b') ORDER BY MAX(created_at) DESC LIMIT 6");
    const [q11] = await pool.query('SELECT * FROM campaign_timeline ORDER BY changed_at DESC LIMIT 20');
    const [q12] = await pool.query("SELECT DATE_FORMAT(created_at, '%b') AS month, COUNT(*) AS count FROM campaigns GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b') ORDER BY MAX(created_at) DESC LIMIT 6");

    const [q10_new_creators] = await pool.query('SELECT COUNT(*) AS total FROM creators WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())');
    const [q10_new_brands] = await pool.query('SELECT COUNT(*) AS total FROM brands WHERE MONTH(created_at)=MONTH(NOW()) AND YEAR(created_at)=YEAR(NOW())');
    
    success(res, {
      total_creators: q1[0].total,
      verified_creators: q2[0].total,
      pending_verifications: q3[0].total,
      total_brands: q4[0].total,
      active_campaigns: q5[0].total,
      total_volume: q6[0].total,
      commission_this_month: q7[0].total,
      total_escrow_held: q8[0].total,
      open_disputes: q9[0].total,
      resolved_disputes: q9b[0].total,
      closed_campaigns: q5b[0].total,
      flagged_creators: q1[0].total - q1b[0].total < 0 ? 0 : q1b[0].total,
      new_creators_this_month: q10_new_creators[0].total,
      new_brands_this_month: q10_new_brands[0].total,
      monthly_signups: { creators: q10c.reverse(), brands: q10b.reverse() },
      recent_activity: q11,
      campaign_volume: q12.reverse()
    });
  } catch (err) {
    next(err);
  }
};

// Creators Management
exports.getCreators = async (req, res, next) => {
  try {
    const { status = 'all', search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (status === 'verified') where += ' AND is_verified=true AND is_active=true';
    else if (status === 'unverified') where += ' AND is_verified=false AND is_active=true';
    else if (status === 'inactive') where += ' AND is_active=false';
    let statusFilter = '';

    if (status === 'verified') statusFilter = 'is_verified=true AND is_active=true';
    else if (status === 'unverified') statusFilter = 'is_verified=false AND is_active=true';
    else if (status === 'inactive') statusFilter = 'is_active=false';

    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const query = `
      SELECT cr.id, cr.name, cr.email, cr.phone, cr.location, cr.is_verified, cr.is_active, cr.created_at,
      nd.categories AS category,
      COALESCE((SELECT followers_count FROM creator_social_profiles WHERE creator_id=cr.id AND platform='instagram'), 0) AS instagram_followers,
      COALESCE((SELECT followers_count FROM creator_social_profiles WHERE creator_id=cr.id AND platform='youtube'), 0) AS youtube_followers,
      (SELECT GROUP_CONCAT(platform) FROM creator_social_profiles WHERE creator_id=cr.id) AS platforms
      FROM creators cr
      LEFT JOIN creator_niche_details nd ON nd.creator_id = cr.id
      ${where} ${statusFilter ? ` AND ${statusFilter}` : ''} ORDER BY cr.created_at DESC LIMIT ? OFFSET ?
    `;

    const [creators] = await pool.query(query, [...params, parseInt(limit), parseInt(offset)]);

    const formattedCreators = creators.map(r => ({
      ...r,
      category: r.category ? (typeof r.category === 'string' ? JSON.parse(r.category)[0] : r.category[0]) : 'Niche',
      instagram_followers: parseInt(r.instagram_followers) || 0,
      youtube_followers: parseInt(r.youtube_followers) || 0,
      total_followers: (parseInt(r.instagram_followers) || 0) + (parseInt(r.youtube_followers) || 0),
      platforms: r.platforms ? r.platforms.split(',') : [],
      verification_status: r.is_active === 0 ? 'inactive' : (r.is_verified ? 'verified' : 'unverified')
    }));

    const [count] = await pool.query(`SELECT COUNT(*) AS total FROM creators cr LEFT JOIN creator_niche_details nd ON nd.creator_id = cr.id ${where} ${statusFilter ? ` AND ${statusFilter}` : ''}`, params);
    success(res, { total: count[0].total, page: parseInt(page), limit: parseInt(limit), creators: formattedCreators });
  } catch (err) {
    next(err);
  }
};

exports.getCreatorById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [cr] = await pool.query('SELECT * FROM creators WHERE id=?', [id]);
    const [sp] = await pool.query('SELECT * FROM creator_social_profiles WHERE creator_id=?', [id]);
    const [nd] = await pool.query('SELECT * FROM creator_niche_details WHERE creator_id=?', [id]);
    const [cam] = await pool.query('SELECT c.*, b.name AS brand_name FROM campaigns c JOIN brands b ON b.id=c.brand_id WHERE creator_id=? ORDER BY c.created_at DESC LIMIT 10', [id]);
    const [ear] = await pool.query('SELECT COALESCE(SUM(net_amount),0) AS total_earned, COUNT(*) AS campaigns_done FROM earnings WHERE creator_id=?', [id]);
    const [fla] = await pool.query('SELECT * FROM creator_flags WHERE creator_id=?', [id]);
    
    const { password_hash, ...creator } = cr[0];
    success(res, { creator, social_profiles: sp, niche_details: nd[0], campaigns: cam, earnings: ear[0], flags: fla });
  } catch (err) {
    next(err);
  }
};

exports.verifyCreator = async (req, res, next) => {
  try {
    await pool.query('UPDATE creators SET is_verified=true WHERE id=?', [req.params.id]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Profile Verified ✓', 'Your Gradix creator profile has been verified.')", [req.params.id]);
    success(res, { is_verified: true });
  } catch (err) {
    next(err);
  }
};

exports.unverifyCreator = async (req, res, next) => {
  try {
    await pool.query('UPDATE creators SET is_verified=false WHERE id=?', [req.params.id]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Profile Unverified', 'Your profile verification was removed by admin.')", [req.params.id]);
    success(res, { is_verified: false });
  } catch (err) {
    next(err);
  }
};

/**
 * fakeCheck: run heuristic checks against social profile to decide if account is suspicious.
 * If `auto_flag` is provided in body and true, will perform the same actions as flagFake.
 */
exports.fakeCheck = async (req, res, next) => {
  try {
    const creatorId = req.params.id;
    const { auto_flag, reason } = req.body;

    const [profiles] = await pool.query('SELECT platform, followers_count, avg_views, engagement_rate FROM creator_social_profiles WHERE creator_id=?', [creatorId]);
    if (!profiles.length) return success(res, { suspicious: false, reason: 'No social profiles found' });

    const issues = [];
    profiles.forEach(p => {
      const followers = Number(p.followers_count) || 0;
      const avgViews = Number(p.avg_views) || 0;
      const er = Number(p.engagement_rate) || 0;
      if (er > 20) issues.push(`${p.platform}: engagement rate unusually high (${er}%)`);
      if (followers > 100000 && avgViews < 1000) issues.push(`${p.platform}: high followers (${followers}) but very low views (${avgViews})`);
      if (avgViews > 0 && followers / avgViews > 200) issues.push(`${p.platform}: followers-to-views ratio suspicious (${Math.round(followers / Math.max(1, avgViews))})`);
    });

    const suspicious = issues.length > 0;

    if (suspicious && auto_flag) {
      // Reuse flagFake behavior: mark unverified + inactive, insert creator_flags and notify
      const flagReason = reason || issues.join('; ');
      await pool.query('UPDATE creators SET is_verified=false, is_active=false WHERE id=?', [creatorId]);
      await pool.query("INSERT INTO creator_flags (creator_id, flagged_by, reason, action) VALUES (?, ?, ?, 'flagged')", [creatorId, req.user.id, flagReason]);
      const [adminRow] = await pool.query('SELECT name FROM admins WHERE id=?', [req.user.id]);
      const adminName = adminRow[0]?.name || 'Admin';
      await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Account Flagged', ?)", [creatorId, `${adminName} flagged your account as fake. Reason: ${flagReason}`]);
    }

    success(res, { suspicious, issues });
  } catch (err) {
    next(err);
  }
};

exports.deactivateCreator = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await pool.query('UPDATE creators SET is_active=false WHERE id=?', [req.params.id]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Account Deactivated', ?)", [req.params.id, reason || 'Your account has been deactivated by admin.']);
    success(res, null, 'Creator deactivated');
  } catch (err) {
    next(err);
  }
};

exports.activateCreator = async (req, res, next) => {
  try {
    await pool.query('UPDATE creators SET is_active=true WHERE id=?', [req.params.id]);
    success(res, null, 'Creator activated');
  } catch (err) {
    next(err);
  }
};

exports.flagFake = async (req, res, next) => {
  try {
    const { reason } = req.body;
    await pool.query('UPDATE creators SET is_verified=false, is_active=false WHERE id=?', [req.params.id]);
    await pool.query("INSERT INTO creator_flags (creator_id, flagged_by, reason, action) VALUES (?, ?, ?, 'flagged')", [req.params.id, req.user.id, reason]);
    // Notify the creator
    const [adminRow] = await pool.query('SELECT name FROM admins WHERE id=?', [req.user.id]);
    const adminName = adminRow[0]?.name || 'Admin';
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Account Flagged', ?)", [req.params.id, `${adminName} flagged your account as fake. Reason: ${reason || 'Not provided'}`]);

    success(res, null, 'Creator flagged as fake');
  } catch (err) {
    next(err);
  }
};

exports.clearFlag = async (req, res, next) => {
  try {
    await pool.query('UPDATE creators SET is_verified=true, is_active=true WHERE id=?', [req.params.id]);
    await pool.query("INSERT INTO creator_flags (creator_id, flagged_by, action) VALUES (?, ?, 'cleared')", [req.params.id, req.user.id]);
    // Notify the creator
    const [adminRow] = await pool.query('SELECT name FROM admins WHERE id=?', [req.user.id]);
    const adminName = adminRow[0]?.name || 'Admin';
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Flag Cleared', ?)", [req.params.id, `${adminName} cleared the fake flag on your account.`]);

    success(res, null, 'Flag cleared');
  } catch (err) {
    next(err);
  }
};

// Brands Management
exports.getBrands = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) { where += ' AND (b.name LIKE ? OR b.email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    const [brands] = await pool.query(`
      SELECT b.id, b.name, b.email, b.phone, b.website, b.category, b.is_active, b.created_at, 
      (SELECT COUNT(*) FROM campaigns WHERE brand_id=b.id) AS total_campaigns,
      (SELECT COALESCE(SUM(amount),0) FROM brand_payments WHERE brand_id=b.id AND payment_status='completed') AS total_spend
      FROM brands b
      ${where} ORDER BY b.created_at DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [count] = await pool.query(`SELECT COUNT(*) AS total FROM brands b ${where}`, params);
    success(res, { total: count[0].total, page: parseInt(page), limit: parseInt(limit), brands });
  } catch (err) {
    next(err);
  }
};

exports.getBrandById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [br] = await pool.query('SELECT * FROM brands WHERE id=?', [id]);
    const [pr] = await pool.query('SELECT * FROM brand_preferences WHERE brand_id=?', [id]);
    const [ve] = await pool.query('SELECT * FROM brand_verification WHERE brand_id=?', [id]);
    const [ca] = await pool.query('SELECT * FROM campaigns WHERE brand_id=? ORDER BY created_at DESC LIMIT 10', [id]);
    const [pay] = await pool.query('SELECT COALESCE(SUM(amount),0) AS total_spend FROM brand_payments WHERE brand_id=? AND payment_status="completed"', [id]);
    success(res, { brand: br[0], preferences: pr[0], verification: ve[0], campaigns: ca, total_spend: pay[0].total_spend });
  } catch (err) {
    next(err);
  }
};

exports.deactivateBrand = async (req, res, next) => {
  try {
    await pool.query('UPDATE brands SET is_active=false WHERE id=?', [req.params.id]);
    success(res, null, 'Brand deactivated');
  } catch (err) {
    next(err);
  }
};

exports.activateBrand = async (req, res, next) => {
  try {
    await pool.query('UPDATE brands SET is_active=true WHERE id=?', [req.params.id]);
    success(res, null, 'Brand activated');
  } catch (err) {
    next(err);
  }
};

// Campaigns Management
exports.getCampaigns = async (req, res, next) => {
  try {
    const { status, brand_id, creator_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];

    if (status) { where += ' AND c.status=?'; params.push(status); }
    if (brand_id) { where += ' AND c.brand_id=?'; params.push(brand_id); }
    if (creator_id) { where += ' AND c.creator_id=?'; params.push(creator_id); }

    const [campaigns] = await pool.query(`
      SELECT c.*, b.name AS brand_name, cr.name AS creator_name, cr.profile_photo
      FROM campaigns c JOIN brands b ON b.id=c.brand_id JOIN creators cr ON cr.id=c.creator_id
      ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const statusMap = { 'request_sent': 0, 'creator_accepted': 1, 'agreement_locked': 2, 'content_uploaded': 3, 'brand_approved': 4, 'posted_live': 5, 'analytics_collected': 6, 'escrow_released': 7, 'campaign_closed': 8 };
    const results = campaigns.map(c => ({ ...c, progress_step: statusMap[c.status] || 0 }));

    const [count] = await pool.query(`SELECT COUNT(*) AS total FROM campaigns c ${where}`, params);
    success(res, { total: count[0].total, page: parseInt(page), limit: parseInt(limit), campaigns: results });
  } catch (err) {
    next(err);
  }
};

exports.adminApproveCampaign = async (req, res, next) => {
  try {
    const id = req.params.id;
    await pool.query("UPDATE campaigns SET status='brand_approved', updated_at=NOW() WHERE id=?", [id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'brand_approved', 'admin')", [id]);
    const [camp] = await pool.query('SELECT creator_id FROM campaigns WHERE id=?', [id]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Content Approved', 'Your content was approved by admin.')", [camp[0].creator_id]);
    success(res, null, 'Campaign approved by admin');
  } catch (err) {
    next(err);
  }
};

exports.postLive = async (req, res, next) => {
  try {
    const id = req.params.id;
    await pool.query("UPDATE campaigns SET status='posted_live', updated_at=NOW() WHERE id=?", [id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'posted_live', 'admin')", [id]);
    const [camp] = await pool.query('SELECT creator_id, brand_id, title FROM campaigns WHERE id=?', [id]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Campaign Live', 'Your campaign is now live.')", [camp[0].creator_id]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('brand', ?, 'Campaign Live', 'Your campaign is now live. Metrics will be auto-collected.')", [camp[0].brand_id]);
    broadcastCampaignUpdate(id, { status: 'posted_live', progress_step: 5 });
    // Auto-collect metrics after 30s
    setTimeout(() => autoCollectMetrics(id, camp[0].brand_id), 30000);
    success(res, null, 'Campaign marked as live. Metrics will be auto-collected.');
  } catch (err) {
    next(err);
  }
};

exports.addAnalytics = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { views, reach, clicks, conversions, engagement_rate, sales_generated, platform } = req.body;
    const [camp] = await pool.query('SELECT escrow_amount, creator_id, brand_id FROM campaigns WHERE id=?', [id]);
    const cpc = conversions > 0 ? camp[0].escrow_amount / conversions : 0;

    await pool.query(
      'INSERT INTO campaign_analytics (campaign_id, views, reach, clicks, conversions, sales_generated, engagement_rate, cost_per_conversion, platform) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, views, reach, clicks, conversions, sales_generated, engagement_rate, cpc, platform]
    );
    await pool.query("UPDATE campaigns SET status='analytics_collected', updated_at=NOW() WHERE id=?", [id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'analytics_collected', 'admin')", [id]);
    
    const [nd] = await pool.query('SELECT categories FROM creator_niche_details WHERE creator_id=?', [camp[0].creator_id]);
    const niche = nd[0] ? JSON.parse(nd[0].categories)[0] : 'General';
    await pool.query('INSERT INTO leads (campaign_id, creator_id, brand_id, niche, deal_value) VALUES (?, ?, ?, ?, ?)', [id, camp[0].creator_id, camp[0].brand_id, niche, camp[0].escrow_amount]);

    broadcastCampaignUpdate(id, { status: 'analytics_collected', progress_step: 6 });
    success(res, null, 'Analytics recorded and leads generated');
  } catch (err) {
    next(err);
  }
};

exports.releaseEscrow = async (req, res, next) => {
  try {
    const id = req.params.id;
    const [camp] = await pool.query('SELECT * FROM campaigns WHERE id=?', [id]);
    if (!camp.length) return error(res, 'Campaign not found', 404);
    const c = camp[0];

    const commission_amt = c.escrow_amount * (c.commission_rate / 100);
    const creator_payout = c.escrow_amount - commission_amt;

    await pool.query('INSERT INTO commissions (campaign_id, brand_id, creator_id, total_amount, commission_rate, commission_amount, creator_payout, status, processed_at) VALUES (?, ?, ?, ?, ?, ?, ?, "processed", NOW())', [id, c.brand_id, c.creator_id, c.escrow_amount, c.commission_rate, commission_amt, creator_payout]);
    await pool.query("INSERT INTO earnings (creator_id, campaign_id, gross_amount, commission_rate, commission_amt, net_amount, payment_status, released_at) VALUES (?, ?, ?, ?, ?, ?, 'released', NOW())", [c.creator_id, id, c.escrow_amount, c.commission_rate, commission_amt, creator_payout]);
    
    const [ana] = await pool.query('SELECT sales_generated, conversions FROM campaign_analytics WHERE campaign_id=?', [id]);
    const sales = ana[0] ? ana[0].sales_generated : 0;
    const convs = ana[0] ? ana[0].conversions : 0;
    const roi = c.escrow_amount > 0 ? ((sales - c.escrow_amount) / c.escrow_amount) * 100 : 0;
    const cpl = convs > 0 ? c.escrow_amount / convs : 0;

    await pool.query('INSERT INTO roi_tracking (campaign_id, brand_id, total_spend, total_revenue, roi_percentage, leads_generated, conversions, cost_per_lead, cost_per_conversion) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, c.brand_id, c.escrow_amount, sales, roi, convs, convs, cpl, cpl]);
    await pool.query("UPDATE campaigns SET status='escrow_released', escrow_status='released', updated_at=NOW() WHERE id=?", [id]);
    await pool.query("UPDATE brand_payments SET payment_status='completed', paid_at=NOW() WHERE campaign_id=?", [id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'escrow_released', 'admin')", [id]);
    
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Payment Released', ?)", [c.creator_id, `Payment of ${creator_payout} released to your account.`]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('brand', ?, 'Escrow Released', ?)", [c.brand_id, `Escrow released for campaign ${c.title}`]);

    broadcastCampaignUpdate(id, { status: 'escrow_released', progress_step: 7, escrow_status: 'released' });
    success(res, { escrow_amount: c.escrow_amount, commission_amount: commission_amt, creator_payout, commission_rate: c.commission_rate });
  } catch (err) {
    next(err);
  }
};

exports.closeCampaign = async (req, res, next) => {
  try {
    const id = req.params.id;
    await pool.query("UPDATE campaigns SET status='campaign_closed', updated_at=NOW() WHERE id=?", [id]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'campaign_closed', 'admin')", [id]);
    const [camp] = await pool.query('SELECT creator_id, brand_id FROM campaigns WHERE id=?', [id]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Campaign Closed', 'Campaign has been officially closed.')", [camp[0].creator_id]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('brand', ?, 'Campaign Closed', 'Campaign has been officially closed.')", [camp[0].brand_id]);
    success(res, null, 'Campaign closed');
  } catch (err) {
    next(err);
  }
};

// Disputes
exports.getDisputes = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    if (status !== 'all') { where += ' AND d.status=?'; }
    const [rows] = await pool.query(`SELECT d.*, c.title AS campaign_title, b.name AS brand_name, cr.name AS creator_name, c.escrow_amount FROM disputes d JOIN campaigns c ON c.id=d.campaign_id JOIN brands b ON b.id=c.brand_id JOIN creators cr ON cr.id=c.creator_id ${where} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`, status !== 'all' ? [status, parseInt(limit), parseInt(offset)] : [parseInt(limit), parseInt(offset)]);
    success(res, rows);
  } catch (err) {
    next(err);
  }
};

exports.reviewDispute = async (req, res, next) => {
  try {
    await pool.query("UPDATE disputes SET status='under_review' WHERE id=?", [req.params.id]);
    success(res, null, 'Dispute status updated to under review');
  } catch (err) {
    next(err);
  }
};

exports.resolveDispute = async (req, res, next) => {
  try {
    const { resolution, favour_of } = req.body;
    await pool.query("UPDATE disputes SET status='resolved', resolution=?, favour_of=?, resolved_at=NOW() WHERE id=?", [resolution, favour_of, req.params.id]);
    
    const [dis] = await pool.query('SELECT campaign_id FROM disputes WHERE id=?', [req.params.id]);
    const cid = dis[0].campaign_id;
    const [camp] = await pool.query('SELECT brand_id, creator_id FROM campaigns WHERE id=?', [cid]);

    if (favour_of === 'creator') {
      // Logic same as releaseEscrow (simplified for brevity here, should ideally be shared)
      await exports.releaseEscrow({ params: { id: cid }, user: { id: req.user.id, role: 'admin' } }, { status: () => ({ json: () => {} }) }, next);
    } else {
      await pool.query("UPDATE campaigns SET escrow_status='refunded' WHERE id=?", [cid]);
      await pool.query("UPDATE brand_payments SET payment_status='completed' WHERE campaign_id=?", [cid]);
      await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('brand', ?, 'Dispute Resolved', 'Dispute resolved in your favour. Refund processed.')", [camp[0].brand_id]);
      await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Dispute Resolved', 'Dispute resolved in favour of brand.')", [camp[0].creator_id]);
    }
    success(res, { status: 'resolved', favour_of });
  } catch (err) {
    next(err);
  }
};

// Commissions & Analytics
exports.getCommissions = async (req, res, next) => {
  try {
    const { status = 'all', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    if (status !== 'all') { where += ' AND cm.status=?'; }
    const [rows] = await pool.query(`SELECT cm.*, c.title AS campaign_title, b.name AS brand_name, cr.name AS creator_name FROM commissions cm JOIN campaigns c ON c.id=cm.campaign_id JOIN brands b ON b.id=cm.brand_id JOIN creators cr ON cr.id=cm.creator_id ${where} ORDER BY cm.processed_at DESC LIMIT ? OFFSET ?`, status !== 'all' ? [status, parseInt(limit), parseInt(offset)] : [parseInt(limit), parseInt(offset)]);
    success(res, rows);
  } catch (err) {
    next(err);
  }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const [q1] = await pool.query('SELECT JSON_UNQUOTE(JSON_EXTRACT(nd.categories,"$[0]")) AS niche, COUNT(c.id) AS campaign_count FROM campaigns c JOIN creator_niche_details nd ON nd.creator_id=c.creator_id GROUP BY 1 ORDER BY 2 DESC LIMIT 10');
    const [q2] = await pool.query('SELECT platform, COUNT(*) AS count FROM campaigns GROUP BY platform');
    const [q3] = await pool.query('SELECT cr.name, SUM(e.net_amount) AS total_earned, COUNT(e.id) AS campaigns FROM earnings e JOIN creators cr ON cr.id=e.creator_id GROUP BY cr.id, cr.name ORDER BY total_earned DESC LIMIT 10');
    const [q4] = await pool.query("SELECT b.name, SUM(bp.amount) AS total_spend, COUNT(DISTINCT c.id) AS campaigns FROM brand_payments bp JOIN brands b ON b.id=bp.brand_id JOIN campaigns c ON c.id=bp.campaign_id WHERE bp.payment_status='completed' GROUP BY b.id, b.name ORDER BY total_spend DESC LIMIT 10");
    success(res, { top_niches: q1, platform_distribution: q2, top_creators: q3, top_brands: q4 });
  } catch (err) {
    next(err);
  }
};

exports.getSuspiciousCreators = async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT cr.id, cr.name, cr.email, sp.followers_count, sp.avg_views, sp.engagement_rate, sp.platform
      FROM creators cr JOIN creator_social_profiles sp ON sp.creator_id=cr.id
      WHERE cr.is_active=true AND (sp.engagement_rate > 20 OR (sp.followers_count > 100000 AND sp.avg_views < 1000) OR (sp.followers_count > 0 AND sp.avg_views > 0 AND (sp.followers_count / sp.avg_views) > 200))
      ORDER BY sp.engagement_rate DESC
    `);
    const results = rows.map(r => ({ ...r, flag_reason: r.engagement_rate > 20 ? 'Engagement rate too high' : (r.followers_count > 100000 && r.avg_views < 1000 ? 'Views too low for follower count' : 'Suspicious follower-to-view ratio') }));
    success(res, results);
  } catch (err) {
    next(err);
  }
};

// Notifications
exports.sendNotification = async (req, res, next) => {
  try {
    const { user_type, user_id, title, message } = req.body;
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', [user_type, user_id, title, message]);
    created(res, null, 'Notification sent');
  } catch (err) {
    next(err);
  }
};
