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

    if (Object.keys(fields).length > 0) {
      const keys = Object.keys(fields).map(k => `${k} = ?`).join(', ');
      const values = [...Object.values(fields), req.user.id];
      await pool.query(`UPDATE creators SET ${keys} WHERE id = ?`, values);
    }

    if (body.instagram_url) {
      const [existingIg] = await pool.query('SELECT id FROM creator_social_profiles WHERE creator_id = ? AND platform = ?', [req.user.id, 'instagram']);
      if (existingIg.length > 0) {
        await pool.query('UPDATE creator_social_profiles SET profile_url=?, followers_count=?, avg_views=?, engagement_rate=? WHERE creator_id=? AND platform=?', 
          [body.instagram_url, body.instagram_followers, body.instagram_avg_views, body.instagram_er, req.user.id, 'instagram']);
      } else {
        await pool.query('INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count, avg_views, engagement_rate) VALUES (?, ?, ?, ?, ?, ?)', 
          [req.user.id, 'instagram', body.instagram_url, body.instagram_followers, body.instagram_avg_views, body.instagram_er]);
      }
      if (body.instagram_verified) {
        await pool.query('UPDATE creators SET is_verified = true WHERE id = ?', [req.user.id]);
      }
    }

    if (body.youtube_url) {
      const [existingYt] = await pool.query('SELECT id FROM creator_social_profiles WHERE creator_id = ? AND platform = ?', [req.user.id, 'youtube']);
      if (existingYt.length > 0) {
        await pool.query('UPDATE creator_social_profiles SET profile_url=?, followers_count=?, avg_views=?, engagement_rate=? WHERE creator_id=? AND platform=?', 
          [body.youtube_url, body.youtube_subscribers, body.youtube_avg_views, body.youtube_er, req.user.id, 'youtube']);
      } else {
        await pool.query('INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count, avg_views, engagement_rate) VALUES (?, ?, ?, ?, ?, ?)', 
          [req.user.id, 'youtube', body.youtube_url, body.youtube_subscribers, body.youtube_avg_views, body.youtube_er]);
      }
    }

    if (body.category) {
      const [existingNiche] = await pool.query('SELECT id FROM creator_niche_details WHERE creator_id = ?', [req.user.id]);
      if (existingNiche.length > 0) {
        await pool.query('UPDATE creator_niche_details SET categories = ? WHERE creator_id = ?', [JSON.stringify([body.category]), req.user.id]);
      } else {
        await pool.query('INSERT INTO creator_niche_details (creator_id, categories) VALUES (?, ?)', [req.user.id, JSON.stringify([body.category])]);
      }
    }

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
    const creator_id = req.user.id;
    const [
      [earningsThisMonth],
      [earningsLastMonth],
      [activeCampaignsCount],
      [pendingRequestsCount],
      activeCampaignsList,
      newRequests,
      upcomingDeadlines,
      monthlyEarnings,
      [profileData]
    ] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM(net_amount), 0) AS earnings_this_month FROM earnings WHERE creator_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) AND payment_status IN ('released','withdrawn')`, [creator_id]),
      pool.query(`SELECT COALESCE(SUM(net_amount), 0) AS earnings_last_month FROM earnings WHERE creator_id = ? AND MONTH(created_at) = MONTH(NOW()) - 1 AND YEAR(created_at) = YEAR(NOW()) AND payment_status IN ('released','withdrawn')`, [creator_id]),
      pool.query(`SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status NOT IN ('campaign_closed','declined','escrow_released','request_sent')`, [creator_id]),
      pool.query(`SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status = 'request_sent'`, [creator_id]),
      pool.query(`SELECT c.id AS campaign_id, c.title, c.deliverable, c.deadline, c.budget AS amount, c.status, b.name AS brand_name, DATEDIFF(c.deadline, NOW()) AS days_remaining FROM campaigns c JOIN brands b ON b.id = c.brand_id WHERE c.creator_id = ? AND c.status NOT IN ('campaign_closed','declined','escrow_released','request_sent') ORDER BY c.deadline ASC LIMIT 5`, [creator_id]),
      pool.query(`SELECT c.id AS campaign_id, c.title, c.deliverable, c.budget AS amount, c.respond_by, DATEDIFF(c.respond_by, NOW()) AS days_to_respond, b.name AS brand_name, b.logo_url AS brand_logo, UPPER(SUBSTRING(b.name, 1, 2)) AS brand_initials FROM campaigns c JOIN brands b ON b.id = c.brand_id WHERE c.creator_id = ? AND c.status = 'request_sent' ORDER BY c.respond_by ASC LIMIT 2`, [creator_id]),
      pool.query(`SELECT c.id AS campaign_id, c.title, c.deliverable, c.deadline, c.status, b.name AS brand_name, DATEDIFF(c.deadline, NOW()) AS days_remaining FROM campaigns c JOIN brands b ON b.id = c.brand_id WHERE c.creator_id = ? AND c.deadline >= NOW() AND c.status NOT IN ('campaign_closed','declined','escrow_released') ORDER BY c.deadline ASC LIMIT 3`, [creator_id]),
      pool.query(`SELECT DATE_FORMAT(created_at, '%b') AS month, YEAR(created_at) AS year, MONTH(created_at) AS month_num, COALESCE(SUM(net_amount), 0) AS total FROM earnings WHERE creator_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 7 MONTH) AND payment_status IN ('released','withdrawn') GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b') ORDER BY YEAR(created_at) ASC, MONTH(created_at) ASC`, [creator_id]),
      pool.query(`SELECT id, name, display_name, profile_photo, is_verified, location FROM creators WHERE id = ?`, [creator_id])
    ]);

    const thisMonthAmt = earningsThisMonth[0].earnings_this_month;
    const lastMonthAmt = earningsLastMonth[0].earnings_last_month;
    const earningsChangePct = lastMonthAmt > 0 ? (((thisMonthAmt - lastMonthAmt) / lastMonthAmt) * 100).toFixed(1) : null;
    const deadlineSoonCount = activeCampaignsList[0].filter(c => c.days_remaining !== null && c.days_remaining <= 7).length;

    success(res, {
      creator: profileData[0],
      earnings_this_month: { amount: thisMonthAmt, change_pct: earningsChangePct, direction: earningsChangePct >= 0 ? 'up' : 'down' },
      active_campaigns: { count: activeCampaignsCount[0].count, deadline_soon_count: deadlineSoonCount },
      pending_requests: { count: pendingRequestsCount[0].count, respond_within_hours: 48 },
      active_campaigns_list: activeCampaignsList[0],
      new_requests: newRequests[0],
      upcoming_deadlines: upcomingDeadlines[0],
      monthly_earnings_chart: monthlyEarnings[0]
    });
  } catch (err) {
    next(err);
  }
};

// Requests & Campaigns
exports.getRequests = async (req, res, next) => {
  try {
    const creator_id = req.user.id;
    const { status = 'all', search = '', page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE c.creator_id = ?';
    const params = [creator_id];

    if (status === 'pending') where += " AND c.status = 'request_sent'";
    else if (status === 'accepted') where += " AND c.status IN ('creator_accepted','agreement_locked','content_uploaded','brand_approved','posted_live','analytics_collected')";
    else if (status === 'completed') where += " AND c.status IN ('campaign_closed','escrow_released')";

    if (search) {
      where += ' AND (b.name LIKE ? OR c.title LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [campaigns] = await pool.query(`
      SELECT
        c.id AS campaign_id, c.title, c.brief, c.campaign_goal, c.platform,
        c.content_type, c.number_of_posts AS deliverable, c.budget AS amount,
        c.platform_fee, c.total_to_escrow, c.tracking_link, c.tracking_link_provided,
        c.start_date, c.deadline AS end_date, c.respond_by, c.deliverables_required,
        c.status, c.escrow_status, c.created_at,
        b.id AS brand_id, b.name AS brand_name, b.logo_url AS brand_logo,
        UPPER(LEFT(b.name, 2)) AS brand_initials,
        CASE WHEN c.tracking_link_provided = true THEN 'Provided' ELSE 'Not Provided' END AS tracking_label,
        CASE c.escrow_status WHEN 'held' THEN 'Secured' WHEN 'pending' THEN 'Pending' WHEN 'released' THEN 'Released' ELSE c.escrow_status END AS escrow_label,
        DATEDIFF(c.respond_by, NOW()) AS days_to_respond,
        CASE WHEN DATEDIFF(c.respond_by, NOW()) <= 2 THEN 'urgent' WHEN DATEDIFF(c.respond_by, NOW()) <= 5 THEN 'moderate' ELSE 'normal' END AS urgency,
        CONCAT(DATE_FORMAT(c.start_date, '%b %d'), ' - ', DATE_FORMAT(c.deadline, '%b %d')) AS timeline_label
      FROM campaigns c
      JOIN brands b ON b.id = c.brand_id
      ${where}
      ORDER BY CASE c.status WHEN 'request_sent' THEN 0 ELSE 1 END ASC, c.respond_by ASC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [[total], [pending], [accepted], [completed], [countRow]] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ?', [creator_id]),
      pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status = 'request_sent'", [creator_id]),
      pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status IN ('creator_accepted','agreement_locked','content_uploaded','brand_approved','posted_live','analytics_collected')", [creator_id]),
      pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status IN ('campaign_closed','escrow_released')", [creator_id]),
      pool.query(`SELECT COUNT(*) AS count FROM campaigns c JOIN brands b ON b.id = c.brand_id ${where}`, params)
    ]);

    success(res, {
      counts: { total: total[0].count, pending: pending[0].count, accepted: accepted[0].count, completed: completed[0].count },
      pagination: { page: parseInt(page), limit: parseInt(limit), total_records: countRow[0].count, total_pages: Math.ceil(countRow[0].count / limit) },
      requests: campaigns
    });
  } catch (err) {
    next(err);
  }
};

exports.getRequestById = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;

    const [campResult] = await pool.query(`
      SELECT c.*, b.name AS brand_name, b.logo_url, b.website, b.category AS brand_category
      FROM campaigns c JOIN brands b ON b.id = c.brand_id
      WHERE c.id = ? AND c.creator_id = ?
    `, [campaignId, creatorId]);

    if (!campResult.length) return error(res, 'Campaign not found or unauthorized', 404);

    const [[timelineResult], [submissionsResult], [negotiationsResult]] = await Promise.all([
      pool.query('SELECT * FROM campaign_timeline WHERE campaign_id = ? ORDER BY changed_at ASC', [campaignId]),
      pool.query('SELECT * FROM content_submissions WHERE campaign_id = ? ORDER BY submitted_at DESC', [campaignId]),
      pool.query('SELECT * FROM campaign_negotiations WHERE campaign_id = ? AND creator_id = ?', [campaignId, creatorId])
    ]);

    success(res, {
      ...campResult[0],
      campaign_timeline: timelineResult,
      content_submissions: submissionsResult,
      negotiations: negotiationsResult
    });
  } catch (err) {
    next(err);
  }
};

exports.acceptRequest = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;

    const [campResult] = await pool.query('SELECT id, status, title, brand_id FROM campaigns WHERE id = ? AND creator_id = ?', [campaignId, creatorId]);
    if (!campResult.length) return error(res, 'Campaign not found', 404);
    if (campResult[0].status !== 'request_sent') return error(res, 'Campaign already responded to', 400);

    await pool.query("UPDATE campaigns SET status='creator_accepted', updated_at=NOW() WHERE id = ? AND creator_id = ?", [campaignId, creatorId]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'creator_accepted', 'creator', 'Creator accepted the collaboration')", [campaignId]);

    const [brand] = await pool.query('SELECT name FROM brands WHERE id=?', [campResult[0].brand_id]);
    const [creatorInfo] = await pool.query('SELECT name FROM creators WHERE id=?', [creatorId]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['brand', campResult[0].brand_id, `${creatorInfo[0].name} accepted your campaign request`, `${creatorInfo[0].name} accepted collaboration for "${campResult[0].title}"`]);

    success(res, { campaign_id: campaignId, status: 'creator_accepted' });
  } catch (err) {
    next(err);
  }
};

exports.declineRequest = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;
    const { reason } = req.body;

    const [campResult] = await pool.query('SELECT id, status, title, brand_id FROM campaigns WHERE id = ? AND creator_id = ?', [campaignId, creatorId]);
    if (!campResult.length) return error(res, 'Campaign not found', 404);
    if (campResult[0].status !== 'request_sent') return error(res, 'Campaign already responded to', 400);

    await pool.query("UPDATE campaigns SET status='declined', brand_rejection_reason=?, updated_at=NOW() WHERE id=? AND creator_id=?", [reason || '', campaignId, creatorId]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'declined', 'creator', ?)", [campaignId, 'Creator declined: ' + (reason || 'No reason provided')]);

    const [creatorInfo] = await pool.query('SELECT name FROM creators WHERE id=?', [creatorId]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['brand', campResult[0].brand_id, `${creatorInfo[0].name} declined your campaign request`, `${creatorInfo[0].name} declined collaboration for "${campResult[0].title}"`]);

    success(res, { status: 'declined' });
  } catch (err) {
    next(err);
  }
};

exports.negotiateRequest = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;
    const { proposed_amount, message } = req.body;

    const [campResult] = await pool.query('SELECT id, status, title, brand_id FROM campaigns WHERE id = ? AND creator_id = ?', [campaignId, creatorId]);
    if (!campResult.length) return error(res, 'Campaign not found', 404);
    if (campResult[0].status !== 'request_sent') return error(res, 'Campaign already responded to', 400);

    const [negResult] = await pool.query("INSERT INTO campaign_negotiations (campaign_id, creator_id, proposed_amount, message, status) VALUES (?, ?, ?, ?, 'pending')", [campaignId, creatorId, proposed_amount, message]);
    await pool.query("UPDATE campaigns SET negotiate_amount=?, negotiate_message=? WHERE id=?", [proposed_amount, message, campaignId]);

    const [creatorInfo] = await pool.query('SELECT name FROM creators WHERE id=?', [creatorId]);
    await pool.query('INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)', ['brand', campResult[0].brand_id, 'New rate proposal', `${creatorInfo[0].name} proposed a new rate for "${campResult[0].title}"`]);

    created(res, { negotiation_id: negResult.insertId, proposed_amount, status: 'pending' });
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

exports.getCampaigns = async (req, res, next) => {
  try {
    const creator_id = req.user.id;
    
    const [campaigns] = await pool.query(`
      SELECT
        c.id AS campaign_id, c.title, c.number_of_posts AS deliverable, c.platform,
        c.budget AS campaign_amount, c.deadline, c.status, c.escrow_status, c.content_url,
        CASE c.status
          WHEN 'creator_accepted'    THEN 1
          WHEN 'agreement_locked'    THEN 2
          WHEN 'content_uploaded'    THEN 3
          WHEN 'brand_approved'      THEN 4
          WHEN 'posted_live'         THEN 5
          WHEN 'analytics_collected' THEN 6
          WHEN 'escrow_released'     THEN 7
          WHEN 'campaign_closed'     THEN 8
          ELSE 0
        END AS progress_step,
        CASE c.escrow_status
          WHEN 'held'     THEN 'Secured'
          WHEN 'pending'  THEN 'Pending'
          WHEN 'released' THEN 'Released'
          ELSE c.escrow_status
        END AS escrow_label,
        b.name AS brand_name, b.logo_url AS brand_logo, UPPER(LEFT(b.name,2)) AS brand_initials,
        DATEDIFF(c.deadline, NOW()) AS days_until_deadline
      FROM campaigns c
      JOIN brands b ON b.id = c.brand_id
      WHERE c.creator_id = ? AND c.status NOT IN ('request_sent','declined')
      ORDER BY
        CASE c.status
          WHEN 'content_uploaded'    THEN 0
          WHEN 'creator_accepted'    THEN 1
          WHEN 'agreement_locked'    THEN 2
          WHEN 'brand_approved'      THEN 3
          WHEN 'posted_live'         THEN 4
          WHEN 'analytics_collected' THEN 5
          WHEN 'escrow_released'     THEN 6
          WHEN 'campaign_closed'     THEN 7
          ELSE 8
        END ASC,
        c.deadline ASC
    `, [creator_id]);

    const [active] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status NOT IN ('campaign_closed','escrow_released','request_sent','declined')", [creator_id]);
    const [completed] = await pool.query("SELECT COUNT(*) AS count FROM campaigns WHERE creator_id = ? AND status IN ('campaign_closed','escrow_released')", [creator_id]);

    success(res, {
      active_count: active[0].count,
      completed_count: completed[0].count,
      campaigns
    });
  } catch (err) {
    next(err);
  }
};

exports.getCampaignById = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;

    const [campResult] = await pool.query(`
      SELECT c.*, b.name AS brand_name, b.logo_url AS brand_logo, b.website AS brand_website, b.category AS brand_category,
        CASE c.status WHEN 'request_sent' THEN 0 WHEN 'creator_accepted' THEN 1 WHEN 'agreement_locked' THEN 2 WHEN 'content_uploaded' THEN 3 WHEN 'brand_approved' THEN 4 WHEN 'posted_live' THEN 5 WHEN 'analytics_collected' THEN 6 WHEN 'escrow_released' THEN 7 WHEN 'campaign_closed' THEN 8 ELSE 0 END AS progress_step,
        DATEDIFF(c.deadline, NOW()) AS days_until_deadline
      FROM campaigns c
      JOIN brands b ON b.id = c.brand_id
      WHERE c.id = ? AND c.creator_id = ?
    `, [campaignId, creatorId]);

    if (!campResult.length) return error(res, 'Campaign not found or unauthorized', 404);

    const [[timelineResult], [submissionsResult], [earningsResult], [analyticsResult]] = await Promise.all([
      pool.query('SELECT status, changed_by, note, changed_at FROM campaign_timeline WHERE campaign_id = ? ORDER BY changed_at ASC', [campaignId]),
      pool.query('SELECT id, file_path, file_name, file_size, file_type, duration_seconds, caption, submission_note, version, status, rejection_note, submitted_at, reviewed_at FROM content_submissions WHERE campaign_id = ? AND creator_id = ? ORDER BY version DESC', [campaignId, creatorId]),
      pool.query('SELECT gross_amount, commission_rate, commission_amt, net_amount, payment_status, released_at FROM earnings WHERE campaign_id = ? AND creator_id = ?', [campaignId, creatorId]),
      pool.query('SELECT views, reach, clicks, conversions, engagement_rate, sales_generated, recorded_at FROM campaign_analytics WHERE campaign_id = ?', [campaignId])
    ]);

    success(res, {
      ...campResult[0],
      campaign_timeline: timelineResult,
      content_submissions: submissionsResult,
      earnings: earningsResult[0] || null,
      analytics: analyticsResult[0] || null
    });
  } catch (err) {
    next(err);
  }
};

exports.uploadContent = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;

    if (!req.file) return error(res, 'No file uploaded', 400);

    const [campResult] = await pool.query('SELECT id, status, brand_id, title FROM campaigns WHERE id = ? AND creator_id = ?', [campaignId, creatorId]);
    if (!campResult.length) return error(res, 'Campaign not found', 404);

    const status = campResult[0].status;
    if (['request_sent', 'creator_accepted'].includes(status)) {
      return error(res, 'Escrow must be funded before uploading content', 400);
    }
    if (!['agreement_locked', 'content_uploaded'].includes(status)) {
      return error(res, 'Content already approved or in invalid status', 400);
    }

    const [countResult] = await pool.query('SELECT COUNT(*) AS version_count FROM content_submissions WHERE campaign_id = ? AND creator_id = ?', [campaignId, creatorId]);
    const version = countResult[0].version_count + 1;

    const { caption, submission_note } = req.body;

    const [subResult] = await pool.query(`
      INSERT INTO content_submissions (campaign_id, creator_id, file_path, file_name, file_size, file_type, caption, submission_note, version, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted')
    `, [campaignId, creatorId, req.file.path, req.file.originalname, req.file.size, req.file.mimetype, caption || null, submission_note || null, version]);

    await pool.query("UPDATE campaigns SET content_url = ?, status = 'content_uploaded', updated_at = NOW() WHERE id = ? AND creator_id = ?", [req.file.path, campaignId, creatorId]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'content_uploaded', 'creator', ?)", [campaignId, `Creator uploaded content (version ${version})`]);

    const [creatorInfo] = await pool.query('SELECT name FROM creators WHERE id = ?', [creatorId]);
    await pool.query("INSERT INTO notifications (user_type, user_id, title, message) VALUES ('brand', ?, 'Content Submitted for Review', ?)", [campResult[0].brand_id, `${creatorInfo[0].name} uploaded content for "${campResult[0].title}" — Version ${version}`]);

    success(res, {
      submission_id: subResult.insertId,
      campaign_id: parseInt(campaignId),
      file_path: req.file.path,
      file_name: req.file.originalname,
      file_size: req.file.size,
      version,
      status: 'submitted',
      campaign_status: 'content_uploaded',
      message: 'Content uploaded successfully, awaiting brand approval'
    });
  } catch (err) {
    next(err);
  }
};

exports.getCampaignSubmissions = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;

    const [campResult] = await pool.query('SELECT id FROM campaigns WHERE id = ? AND creator_id = ?', [campaignId, creatorId]);
    if (!campResult.length) return error(res, 'Campaign not found or unauthorized', 404);

    const [submissions] = await pool.query(`
      SELECT id, file_path, file_name, file_size, file_type, duration_seconds, caption, submission_note, version, status, rejection_note, submitted_at, reviewed_at
      FROM content_submissions WHERE campaign_id = ? AND creator_id = ? ORDER BY version DESC
    `, [campaignId, creatorId]);

    success(res, { submissions });
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
