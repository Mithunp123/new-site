const pool = require('../config/db');
const { success, created, error } = require('../helpers/response');
const { hashPassword, comparePassword } = require('../helpers/bcrypt');

// Social Profiles
exports.upsertSocialProfile = async (req, res, next) => {
  try {
    const creator_id = req.user.id;
    const { platform, profile_url, followers_count, avg_views, engagement_rate, audience_location } = req.body;

    const [existing] = await pool.query(
      'SELECT id FROM creator_social_profiles WHERE creator_id = ? AND platform = ?',
      [creator_id, platform]
    );

    if (existing.length > 0) {
      await pool.query(
        'UPDATE creator_social_profiles SET profile_url = ?, followers_count = ?, avg_views = ?, engagement_rate = ?, audience_location = ? WHERE creator_id = ? AND platform = ?',
        [profile_url, followers_count, avg_views, engagement_rate, audience_location, creator_id, platform]
      );
    } else {
      await pool.query(
        'INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count, avg_views, engagement_rate, audience_location) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [creator_id, platform, profile_url, followers_count, avg_views, engagement_rate, audience_location]
      );
    }
    success(res, null, 'Social profile updated');
  } catch (err) {
    next(err);
  }
};

exports.getSocialProfiles = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM creator_social_profiles WHERE creator_id = ?', [req.user.id]);
    success(res, rows);
  } catch (err) {
    next(err);
  }
};

// Niche Details
exports.upsertNicheDetails = async (req, res, next) => {
  try {
    const creator_id = req.user.id;
    const { categories, subcategories, worked_with_brands, performance_metrics, sample_links, collaboration_preference } = req.body;
    const screenshots = req.files ? req.files.map(f => f.path) : [];

    const [existing] = await pool.query('SELECT id FROM creator_niche_details WHERE creator_id = ?', [creator_id]);

    if (existing.length > 0) {
      await pool.query(
        'UPDATE creator_niche_details SET categories = ?, subcategories = ?, worked_with_brands = ?, performance_metrics = ?, screenshots_testimonials = ?, sample_links = ?, collaboration_preference = ? WHERE creator_id = ?',
        [JSON.stringify(categories), JSON.stringify(subcategories), JSON.stringify(worked_with_brands), performance_metrics, JSON.stringify(screenshots), JSON.stringify(sample_links), collaboration_preference, creator_id]
      );
    } else {
      await pool.query(
        'INSERT INTO creator_niche_details (creator_id, categories, subcategories, worked_with_brands, performance_metrics, screenshots_testimonials, sample_links, collaboration_preference) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [creator_id, JSON.stringify(categories), JSON.stringify(subcategories), JSON.stringify(worked_with_brands), performance_metrics, JSON.stringify(screenshots), JSON.stringify(sample_links), collaboration_preference]
      );
    }
    success(res, null, 'Niche details updated');
  } catch (err) {
    next(err);
  }
};

exports.getNicheDetails = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM creator_niche_details WHERE creator_id = ?', [req.user.id]);
    const details = rows[0] || {};
    // Parse JSON fields
    ['categories', 'subcategories', 'worked_with_brands', 'screenshots_testimonials', 'sample_links'].forEach(field => {
      if (details[field]) details[field] = typeof details[field] === 'string' ? JSON.parse(details[field]) : details[field];
    });
    success(res, details);
  } catch (err) {
    next(err);
  }
};

// Profile
exports.getProfile = async (req, res, next) => {
  try {
    const creator_id = req.user.id;
    const [creatorRows] = await pool.query('SELECT * FROM creators WHERE id = ?', [creator_id]);
    const [socialRows] = await pool.query('SELECT * FROM creator_social_profiles WHERE creator_id = ?', [creator_id]);
    const [nicheRows] = await pool.query('SELECT * FROM creator_niche_details WHERE creator_id = ?', [creator_id]);

    const { password_hash, ...creator } = creatorRows[0];
    console.log(`[getProfile] Sending for ID: ${creator_id}, UPI: ${creator.upi_id}`);
    const niche_details = nicheRows[0] || {};
    ['categories', 'subcategories', 'worked_with_brands', 'screenshots_testimonials', 'sample_links'].forEach(field => {
      if (niche_details[field]) niche_details[field] = typeof niche_details[field] === 'string' ? JSON.parse(niche_details[field]) : niche_details[field];
    });

    success(res, {
      ...creator,
      social_profiles: socialRows,
      niche_details
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const fields = {};
    const body = req.body;
    ['name', 'display_name', 'bio', 'location', 'phone', 'upi_id'].forEach(f => {
      if (body[f] !== undefined) fields[f] = body[f];
    });
    if (body.languages_known) fields.languages_known = JSON.stringify(body.languages_known);

    if (!Object.keys(fields).length) return error(res, 'No fields to update');

    const keys = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const values = [...Object.values(fields), req.user.id];
    
    await pool.query(`UPDATE creators SET ${keys} WHERE id = ?`, values);
    success(res, null, 'Profile updated');
  } catch (err) {
    next(err);
  }
};

exports.updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No photo uploaded');
    await pool.query('UPDATE creators SET profile_photo = ? WHERE id = ?', [req.file.path, req.user.id]);
    success(res, { profile_photo: req.file.path });
  } catch (err) {
    next(err);
  }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.query('SELECT password_hash FROM creators WHERE id = ?', [req.user.id]);
    const isMatch = await comparePassword(current_password, rows[0].password_hash);
    if (!isMatch) return error(res, 'Current password is incorrect', 400);

    const hashed = await hashPassword(new_password);
    await pool.query('UPDATE creators SET password_hash = ? WHERE id = ?', [hashed, req.user.id]);
    success(res, null, 'Password updated');
  } catch (err) {
    next(err);
  }
};

exports.deactivateAccount = async (req, res, next) => {
  try {
    await pool.query('UPDATE creators SET is_active = false WHERE id = ?', [req.user.id]);
    success(res, null, 'Account deactivated');
  } catch (err) {
    next(err);
  }
};

// Dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [q1] = await pool.query('SELECT COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())', [id]);
    const [q2] = await pool.query('SELECT COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id = ? AND MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) AND YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))', [id]);
    const [q3] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status NOT IN ('campaign_closed','declined','escrow_released')", [id]);
    const [q4] = await pool.query("SELECT c.*, b.name AS brand_name FROM campaigns c JOIN brands b ON b.id = c.brand_id WHERE c.creator_id = ? AND c.status NOT IN ('campaign_closed','declined') ORDER BY c.deadline ASC LIMIT 5", [id]);
    const [q5] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status = 'request_sent'", [id]);
    const [q6] = await pool.query("SELECT c.*, b.name AS brand_name FROM campaigns c JOIN brands b ON b.id = c.brand_id WHERE c.creator_id = ? AND c.status = 'request_sent' ORDER BY c.created_at DESC LIMIT 2", [id]);
    const [q7] = await pool.query("SELECT ANY_VALUE(DATE_FORMAT(created_at, '%b')) AS month, COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 MONTH) GROUP BY YEAR(created_at), MONTH(created_at) ORDER BY MIN(created_at) ASC", [id]);
    const [q8] = await pool.query("SELECT c.*, b.name AS brand_name, DATEDIFF(c.deadline, NOW()) AS days_remaining FROM campaigns c JOIN brands b ON b.id = c.brand_id WHERE c.creator_id = ? AND c.deadline >= NOW() AND c.status NOT IN ('campaign_closed','declined') ORDER BY c.deadline ASC LIMIT 3", [id]);
    const [q9] = await pool.query("SELECT COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id = ? AND YEAR(created_at) = YEAR(NOW())", [id]);

    const thisMonth = q1[0].total;
    const lastMonth = q2[0].total;
    const earnings_change_pct = lastMonth === 0 ? (thisMonth > 0 ? 100 : 0) : ((thisMonth - lastMonth) / lastMonth) * 100;

    success(res, {
      earnings_this_month: thisMonth,
      earnings_change_pct,
      active_campaigns_count: q3[0].count,
      active_campaigns: q4,
      pending_requests_count: q5[0].count,
      new_requests: q6,
      monthly_earnings: q7,
      upcoming_deadlines: q8,
      deadline_soon_count: q8.filter(d => d.days_remaining <= 7).length,
      ytd_earnings: q9[0].total
    });
  } catch (err) {
    next(err);
  }
};

// Requests & Campaigns
exports.getRequests = async (req, res, next) => {
  try {
    const id = req.user.id;
    const { status = 'all', search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE c.creator_id = ?';
    const params = [id];

    if (status === 'pending') where += " AND c.status = 'request_sent'";
    else if (status === 'accepted') where += " AND c.status IN ('creator_accepted','agreement_locked','content_uploaded','brand_approved','posted_live')";
    else if (status === 'completed') where += " AND c.status IN ('campaign_closed','escrow_released')";

    if (search) {
      where += ' AND (b.name LIKE ? OR c.title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [campaigns] = await pool.query(`SELECT c.*, b.name AS brand_name, b.logo_url AS brand_logo FROM campaigns c JOIN brands b ON b.id = c.brand_id ${where} LIMIT ? OFFSET ?`, [...params, parseInt(limit), parseInt(offset)]);
    const [countRow] = await pool.query(`SELECT COUNT(*) AS count FROM campaigns c JOIN brands b ON b.id = c.brand_id ${where}`, params);

    const [total] = await pool.query('SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ?', [id]);
    const [pending] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status = 'request_sent'", [id]);
    const [accepted] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status IN ('creator_accepted','agreement_locked','content_uploaded','brand_approved','posted_live')", [id]);
    const [completed] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status IN ('campaign_closed','escrow_released')", [id]);

    success(res, {
      counts: { total: total[0].count, pending: pending[0].count, accepted: accepted[0].count, completed: completed[0].count },
      page: parseInt(page),
      limit: parseInt(limit),
      total_records: countRow[0].count,
      campaigns
    });
  } catch (err) {
    next(err);
  }
};

exports.getCampaigns = async (req, res, next) => {
  try {
    const id = req.user.id;
    const { status = 'all' } = req.query;
    let where = 'WHERE c.creator_id = ?';
    if (status === 'active') where += " AND c.status NOT IN ('campaign_closed','declined','escrow_released')";
    else if (status === 'completed') where += " AND c.status IN ('campaign_closed','escrow_released')";

    const [campaigns] = await pool.query(`
      SELECT c.*, b.name AS brand_name, b.logo_url AS brand_logo, e.payment_status AS escrow_status
      FROM campaigns c
      JOIN brands b ON b.id = c.brand_id
      LEFT JOIN earnings e ON e.campaign_id = c.id
      ${where}
    `, [id]);

    const statusMap = {
      'request_sent': 0, 'creator_accepted': 1, 'agreement_locked': 2,
      'content_uploaded': 3, 'brand_approved': 4, 'posted_live': 5,
      'analytics_collected': 6, 'escrow_released': 7, 'campaign_closed': 8
    };

    const results = campaigns.map(c => ({
      ...c,
      progress_step: statusMap[c.status] || 0
    }));

    const [active] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status NOT IN ('campaign_closed','declined','escrow_released')", [id]);
    const [completed] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status IN ('campaign_closed','escrow_released')", [id]);

    success(res, {
      active_count: active[0].count,
      completed_count: completed[0].count,
      campaigns: results
    });
  } catch (err) {
    next(err);
  }
};

// Earnings
exports.getEarnings = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [q1] = await pool.query('SELECT COALESCE(SUM(gross_amount),0) AS total FROM earnings WHERE creator_id=?', [id]);
    const [q2] = await pool.query("SELECT COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id=? AND payment_status='released' AND withdrawn_at IS NULL", [id]);
    const [q3] = await pool.query("SELECT COALESCE(SUM(gross_amount),0) AS total FROM earnings WHERE creator_id=? AND payment_status='in_escrow'", [id]);
    const [q4] = await pool.query("SELECT COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id=? AND MONTH(created_at)=MONTH(NOW()) AND payment_status IN ('released','in_escrow')", [id]);
    const [q5] = await pool.query("SELECT COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id=? AND MONTH(created_at)=MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))", [id]);
    const [q6] = await pool.query("SELECT c.id, b.name AS brand_name, c.title, e.gross_amount, e.payment_status FROM earnings e JOIN campaigns c ON c.id = e.campaign_id JOIN brands b ON b.id = c.brand_id WHERE e.creator_id = ? AND e.payment_status = 'in_escrow'", [id]);
    const [q7] = await pool.query("SELECT e.*, b.name AS brand_name, c.title AS campaign_title FROM earnings e JOIN campaigns c ON c.id = e.campaign_id JOIN brands b ON b.id = c.brand_id WHERE e.creator_id = ? ORDER BY e.created_at DESC LIMIT 20", [id]);
    const [q8] = await pool.query("SELECT ANY_VALUE(DATE_FORMAT(created_at, '%b')) AS month, COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id = ? GROUP BY YEAR(created_at), MONTH(created_at) ORDER BY MIN(created_at) DESC LIMIT 6", [id]);
    
    const [creator] = await pool.query('SELECT upi_id FROM creators WHERE id = ?', [id]);
    console.log('--- DEBUG EARNINGS ---');
    console.log('User ID from token:', id);
    console.log('Fetched UPI:', creator[0]?.upi_id);
    
    const escrow_total = q6.reduce((acc, curr) => acc + (curr.gross_amount || 0), 0);
    const thisMonth = q4[0]?.total || 0;
    const lastMonth = q5[0]?.total || 0;
    
    let earnings_change_pct = 0;
    if (lastMonth > 0) {
      earnings_change_pct = ((thisMonth - lastMonth) / lastMonth) * 100;
    } else if (thisMonth > 0) {
      earnings_change_pct = 100;
    }


    const responseData = {
      total_earned_all_time: q1[0].total || 0,
      available_to_withdraw: q2[0].total || 0,
      pending_release: q3[0].total || 0,
      this_month: q4[0].total || 0,
      change_pct: earnings_change_pct || 0,
      upi_id: creator[0]?.upi_id || null,
      escrow_balance: {
        total: escrow_total,
        campaigns: (q6 || []).map(c => ({
          brand: c.brand_name,
          amount: c.gross_amount,
          status: 'Active'
        }))
      },
      transaction_history: (q7 || []).map(t => ({
        date: t.created_at,
        brand_name: t.brand_name,
        campaign_title: t.campaign_title,
        amount: t.net_amount,
        payment_status: t.payment_status
      })),
      monthly_chart: (q8 || []).reverse().map(c => ({
        month: c.month,
        total: c.total
      }))
    };
    
    console.log('Final Payload upi_id:', responseData.upi_id);
    success(res, responseData);
  } catch (err) {
    console.error('Error in getEarnings:', err);
    next(err);
  }
};

exports.withdrawEarnings = async (req, res, next) => {
  try {
    const id = req.user.id;
    const { payout_method } = req.body;
    const [row] = await pool.query("SELECT SUM(net_amount) AS total FROM earnings WHERE creator_id=? AND payment_status='released' AND withdrawn_at IS NULL", [id]);
    if (!row[0].total) return error(res, 'No available balance', 400);

    await pool.query("UPDATE earnings SET payment_status='withdrawn', withdrawn_at=NOW(), payout_method=? WHERE creator_id=? AND payment_status='released' AND withdrawn_at IS NULL", [payout_method, id]);
    success(res, { amount_withdrawn: row[0].total, payout_method });
  } catch (err) {
    next(err);
  }
};

// Analytics & Leads
exports.getAnalytics = async (req, res, next) => {
  try {
    const id = req.user.id;
    const { period = '30d' } = req.query;
    const days = parseInt(period) || 30;

    const [current] = await pool.query(`
      SELECT SUM(views) AS total_views, SUM(reach) AS total_reach, SUM(clicks) AS total_clicks, AVG(engagement_rate) AS avg_er, SUM(sales_generated) AS total_sales
      FROM campaign_analytics ca JOIN campaigns c ON c.id = ca.campaign_id
      WHERE c.creator_id = ? AND ca.recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [id, days]);

    const [prev] = await pool.query(`
      SELECT SUM(views) AS total_views, SUM(reach) AS total_reach, SUM(clicks) AS total_clicks, AVG(engagement_rate) AS avg_er, SUM(sales_generated) AS total_sales
      FROM campaign_analytics ca JOIN campaigns c ON c.id = ca.campaign_id
      WHERE c.creator_id = ? AND ca.recorded_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND ca.recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [id, days, days * 2]);

    const [platforms] = await pool.query(`
      SELECT ca.platform, SUM(ca.views) AS views FROM campaign_analytics ca JOIN campaigns c ON c.id = ca.campaign_id
      WHERE c.creator_id = ? AND ca.recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY) GROUP BY ca.platform
    `, [id, days]);

    const [campaigns] = await pool.query(`
      SELECT c.title, ca.views, ca.reach, ca.clicks, ca.engagement_rate, ca.sales_generated
      FROM campaign_analytics ca JOIN campaigns c ON c.id = ca.campaign_id
      WHERE c.creator_id = ? ORDER BY ca.recorded_at DESC
    `, [id]);

    success(res, { totals: current[0], previous: prev[0], platforms, campaigns });
  } catch (err) {
    next(err);
  }
};

exports.getLeads = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [q1] = await pool.query('SELECT COUNT(*) AS total FROM leads WHERE creator_id=?', [id]);
    const [q2] = await pool.query('SELECT COUNT(*) AS count FROM leads WHERE creator_id=? AND converted=true', [id]);
    const [q3] = await pool.query('SELECT AVG(deal_value) AS avg FROM leads WHERE creator_id=?', [id]);
    const [q4] = await pool.query('SELECT MAX(c.title) AS title, COUNT(l.id) AS lead_count FROM leads l JOIN campaigns c ON c.id = l.campaign_id WHERE l.creator_id = ? GROUP BY l.campaign_id ORDER BY lead_count DESC', [id]);
    const [q5] = await pool.query('SELECT niche, COUNT(*) AS total, SUM(CASE WHEN converted=true THEN 1 ELSE 0 END) AS converted_count, ROUND(SUM(CASE WHEN converted=true THEN 1 ELSE 0 END)*100/COUNT(*),1) AS conversion_rate FROM leads WHERE creator_id=? GROUP BY niche ORDER BY conversion_rate DESC', [id]);

    success(res, {
      total_leads: q1[0].total,
      conversion_rate: q1[0].total ? (q2[0].count / q1[0].total) * 100 : 0,
      avg_deal_value: q3[0].avg,
      by_campaign: q4,
      by_niche: q5,
      top_niche: q5[0]
    });
  } catch (err) {
    next(err);
  }
};

// Notifications
exports.getNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notifications WHERE user_type='creator' AND user_id=? ORDER BY created_at DESC LIMIT 50", [req.user.id]);
    success(res, rows);
  } catch (err) {
    next(err);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    await pool.query("UPDATE notifications SET is_read=true WHERE id=? AND user_id=? AND user_type='creator'", [req.params.id, req.user.id]);
    success(res, null, 'Notification marked as read');
  } catch (err) {
    next(err);
  }
};
