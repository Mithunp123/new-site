const pool = require('../config/db');
const { success, error, created } = require('../helpers/response');

// Requests & Campaigns
exports.getRequests = async (req, res, next) => {
  try {
    const creator_id = req.user.id;
    
    // Fetch ALL campaigns for this creator to be absolutely sure we get the data
    const [rows] = await pool.query(`
      SELECT 
        c.*, 
        c.id AS campaign_id,
        c.budget AS amount,
        c.number_of_posts AS deliverable,
        b.name AS brand_name, 
        b.logo_url AS brand_logo,
        UPPER(LEFT(COALESCE(b.name, 'Brand'), 2)) AS brand_initials,
        CASE WHEN c.tracking_link_provided = true THEN 'Provided' ELSE 'Not Provided' END AS tracking_label,
        CASE c.escrow_status WHEN 'held' THEN 'Secured' WHEN 'pending' THEN 'Pending' WHEN 'released' THEN 'Released' ELSE c.escrow_status END AS escrow_label,
        CONCAT(DATE_FORMAT(c.start_date, '%b %d'), ' - ', DATE_FORMAT(c.deadline, '%b %d')) AS timeline_label
      FROM campaigns c 
      LEFT JOIN brands b ON b.id = c.brand_id 
      WHERE c.creator_id = ?
      ORDER BY c.created_at DESC
    `, [creator_id]);

    // Filter in Javascript to avoid any SQL complexity issues
    const { status = 'all', search = '' } = req.query;
    
    let filtered = rows;
    
    if (status === 'pending') {
      filtered = rows.filter(r => r.status === 'request_sent');
    } else if (status === 'accepted') {
      filtered = rows.filter(r => ['creator_accepted', 'agreement_locked', 'content_uploaded', 'brand_approved', 'posted_live', 'analytics_collected'].includes(r.status));
    } else if (status === 'completed') {
      filtered = rows.filter(r => ['campaign_closed', 'escrow_released'].includes(r.status));
    }

    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(r => 
        (r.brand_name && r.brand_name.toLowerCase().includes(s)) || 
        (r.title && r.title.toLowerCase().includes(s))
      );
    }

    const counts = {
      total: rows.length,
      pending: rows.filter(r => r.status === 'request_sent').length,
      accepted: rows.filter(r => ['creator_accepted', 'agreement_locked', 'content_uploaded', 'brand_approved', 'posted_live', 'analytics_collected'].includes(r.status)).length,
      completed: rows.filter(r => ['campaign_closed', 'escrow_released'].includes(r.status)).length
    };

    success(res, {
      counts,
      campaigns: filtered
    });
  } catch (err) {
    console.error('Error in getRequests:', err);
    next(err);
  }
};

exports.getRequestById = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;
    const [campResult] = await pool.query('SELECT c.*, b.name AS brand_name FROM campaigns c JOIN brands b ON b.id = c.brand_id WHERE c.id = ? AND c.creator_id = ?', [campaignId, creatorId]);
    if (!campResult.length) return error(res, 'Campaign not found', 404);
    success(res, campResult[0]);
  } catch (err) { next(err); }
};

exports.acceptRequest = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;
    await pool.query("UPDATE campaigns SET status='creator_accepted', updated_at=NOW() WHERE id = ? AND creator_id = ?", [campaignId, creatorId]);
    await pool.query("INSERT INTO campaign_timeline (campaign_id, status, changed_by, note) VALUES (?, 'creator_accepted', 'creator', 'Accepted')", [campaignId]);
    success(res, { status: 'creator_accepted' });
  } catch (err) { next(err); }
};

exports.declineRequest = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;
    await pool.query("UPDATE campaigns SET status='declined', updated_at=NOW() WHERE id = ? AND creator_id = ?", [campaignId, creatorId]);
    success(res, { status: 'declined' });
  } catch (err) { next(err); }
};

exports.negotiateRequest = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;
    const { proposed_amount, message } = req.body;
    await pool.query("UPDATE campaigns SET negotiate_amount=?, negotiate_message=? WHERE id=?", [proposed_amount, message, campaignId]);
    success(res, { status: 'negotiated' });
  } catch (err) { next(err); }
};

exports.getCampaigns = async (req, res, next) => {
  try {
    const creator_id = req.user.id;
    const [campaigns] = await pool.query(`
      SELECT c.*, b.name AS brand_name, b.logo_url AS brand_logo
      FROM campaigns c JOIN brands b ON b.id = c.brand_id
      WHERE c.creator_id = ? AND c.status NOT IN ('request_sent','declined')
    `, [creator_id]);
    success(res, { campaigns });
  } catch (err) { next(err); }
};

exports.getCampaignById = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;
    const [campResult] = await pool.query('SELECT c.*, b.name AS brand_name FROM campaigns c JOIN brands b ON b.id = c.brand_id WHERE c.id = ? AND c.creator_id = ?', [campaignId, creatorId]);
    if (!campResult.length) return error(res, 'Campaign not found', 404);
    
    const [timeline] = await pool.query('SELECT * FROM campaign_timeline WHERE campaign_id = ? ORDER BY changed_at ASC', [campaignId]);
    const [submissions] = await pool.query('SELECT * FROM content_submissions WHERE campaign_id = ? ORDER BY submitted_at DESC', [campaignId]);
    
    success(res, { ...campResult[0], campaign_timeline: timeline, content_submissions: submissions });
  } catch (err) { next(err); }
};

exports.uploadContent = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;
    if (!req.file) return error(res, 'No file uploaded', 400);
    await pool.query("INSERT INTO content_submissions (campaign_id, creator_id, file_path, status) VALUES (?, ?, ?, 'submitted')", [campaignId, creatorId, req.file.path]);
    await pool.query("UPDATE campaigns SET status='content_uploaded', updated_at=NOW() WHERE id=?", [campaignId]);
    success(res, { status: 'submitted' });
  } catch (err) { next(err); }
};

exports.getEarnings = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [q1] = await pool.query('SELECT COALESCE(SUM(gross_amount),0) AS total FROM earnings WHERE creator_id=?', [id]);
    const [q2] = await pool.query("SELECT COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id=? AND payment_status='released'", [id]);
    const [q3] = await pool.query("SELECT COALESCE(SUM(gross_amount),0) AS total FROM earnings WHERE creator_id=? AND payment_status='in_escrow'", [id]);
    const [creator] = await pool.query('SELECT upi_id FROM creators WHERE id = ?', [id]);
    const [history] = await pool.query('SELECT e.*, b.name AS brand_name, c.title FROM earnings e JOIN campaigns c ON c.id = e.campaign_id JOIN brands b ON b.id = c.brand_id WHERE e.creator_id = ? ORDER BY e.created_at DESC', [id]);
    
    success(res, {
      total_earned_all_time: q1[0].total,
      available_to_withdraw: q2[0].total,
      pending_release: q3[0].total,
      upi_id: creator[0]?.upi_id,
      transaction_history: history
    });
  } catch (err) { next(err); }
};

exports.withdrawEarnings = async (req, res, next) => {
  try {
    const { amount, payout_method } = req.body;
    // Implementation logic here
    success(res, null, 'Withdrawal request submitted');
  } catch (err) { next(err); }
};

exports.getNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notifications WHERE user_type='creator' AND user_id=? ORDER BY created_at DESC", [req.user.id]);
    success(res, rows);
  } catch (err) { next(err); }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    await pool.query("UPDATE notifications SET is_read=true WHERE id=? AND user_id=? AND user_type='creator'", [req.params.id, req.user.id]);
    success(res, null, 'Notification marked as read');
  } catch (err) { next(err); }
};

// Profile & Account
exports.getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT id, name, email, phone, display_name, bio, location, languages_known, profile_photo, is_verified, role FROM creators WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return error(res, 'Creator not found', 404);
    
    const creator = rows[0];
    if (creator.languages_known) creator.languages_known = typeof creator.languages_known === 'string' ? JSON.parse(creator.languages_known) : creator.languages_known;
    
    success(res, creator);
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, display_name, bio, location, languages_known, phone } = req.body;
    await pool.query(
      'UPDATE creators SET name=?, display_name=?, bio=?, location=?, languages_known=?, phone=? WHERE id=?',
      [name, display_name, bio, location, JSON.stringify(languages_known || []), phone, req.user.id]
    );
    success(res, null, 'Profile updated');
  } catch (err) { next(err); }
};

exports.updateProfilePhoto = async (req, res, next) => {
  try {
    if (!req.file) return error(res, 'No file uploaded', 400);
    await pool.query('UPDATE creators SET profile_photo=? WHERE id=?', [req.file.path, req.user.id]);
    success(res, { profile_photo: req.file.path });
  } catch (err) { next(err); }
};

exports.updatePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.query('SELECT password_hash FROM creators WHERE id=?', [req.user.id]);
    const { comparePassword, hashPassword } = require('../helpers/bcrypt');
    const isMatch = await comparePassword(current_password, rows[0].password_hash);
    if (!isMatch) return error(res, 'Incorrect current password', 400);
    const hashed = await hashPassword(new_password);
    await pool.query('UPDATE creators SET password_hash=? WHERE id=?', [hashed, req.user.id]);
    success(res, null, 'Password updated');
  } catch (err) { next(err); }
};

exports.deactivateAccount = async (req, res, next) => {
  try {
    await pool.query('UPDATE creators SET is_active=false WHERE id=?', [req.user.id]);
    success(res, null, 'Account deactivated');
  } catch (err) { next(err); }
};

// Social & Niche
exports.getSocialProfiles = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM creator_social_profiles WHERE creator_id=?', [req.user.id]);
    success(res, rows);
  } catch (err) { next(err); }
};

exports.upsertSocialProfile = async (req, res, next) => {
  try {
    const { platform, profile_url, followers_count, avg_views, engagement_rate } = req.body;
    await pool.query(
      'INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count, avg_views, engagement_rate) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE profile_url=?, followers_count=?, avg_views=?, engagement_rate=?',
      [req.user.id, platform, profile_url, followers_count, avg_views, engagement_rate, profile_url, followers_count, avg_views, engagement_rate]
    );
    success(res, null, 'Social profile updated');
  } catch (err) { next(err); }
};

exports.getNicheDetails = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM creator_niche_details WHERE creator_id=?', [req.user.id]);
    const data = rows[0] || {};
    ['categories', 'subcategories', 'worked_with_brands', 'screenshots_testimonials', 'sample_links'].forEach(f => {
      if (data[f]) data[f] = typeof data[f] === 'string' ? JSON.parse(data[f]) : data[f];
    });
    success(res, data);
  } catch (err) { next(err); }
};

exports.upsertNicheDetails = async (req, res, next) => {
  try {
    const { categories, subcategories, worked_with_brands, collaboration_preference } = req.body;
    const screenshots = req.files ? req.files.map(f => f.path) : [];
    await pool.query(
      'INSERT INTO creator_niche_details (creator_id, categories, subcategories, worked_with_brands, collaboration_preference, screenshots_testimonials) VALUES (?,?,?,?,?,?) ON DUPLICATE KEY UPDATE categories=?, subcategories=?, worked_with_brands=?, collaboration_preference=?, screenshots_testimonials=?',
      [req.user.id, JSON.stringify(categories || []), JSON.stringify(subcategories || []), JSON.stringify(worked_with_brands || []), collaboration_preference, JSON.stringify(screenshots), JSON.stringify(categories || []), JSON.stringify(subcategories || []), JSON.stringify(worked_with_brands || []), collaboration_preference, JSON.stringify(screenshots)]
    );
    success(res, null, 'Niche details updated');
  } catch (err) { next(err); }
};

// Dashboard & Analytics
exports.getDashboard = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [q1] = await pool.query('SELECT COUNT(*) AS count FROM campaigns WHERE creator_id=? AND status NOT IN ("campaign_closed", "declined")', [id]);
    const [q2] = await pool.query('SELECT COALESCE(SUM(net_amount), 0) AS total FROM earnings WHERE creator_id=? AND payment_status="released"', [id]);
    const [q3] = await pool.query('SELECT COUNT(*) AS count FROM campaigns WHERE creator_id=? AND status="request_sent"', [id]);
    
    success(res, {
      active_campaigns: q1[0].count,
      total_earnings: q2[0].total,
      new_requests: q3[0].count
    });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM campaign_analytics ca JOIN campaigns c ON c.id = ca.campaign_id WHERE c.creator_id=?', [req.user.id]);
    success(res, rows);
  } catch (err) { next(err); }
};

exports.getLeads = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT l.*, b.name AS brand_name, c.title FROM leads l JOIN brands b ON b.id = l.brand_id JOIN campaigns c ON c.id = l.campaign_id WHERE l.creator_id=?', [req.user.id]);
    success(res, rows);
  } catch (err) { next(err); }
};

exports.getCampaignSubmissions = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM content_submissions WHERE campaign_id=? AND creator_id=?', [req.params.campaignId, req.user.id]);
    success(res, rows);
  } catch (err) { next(err); }
};
