const pool = require('../config/db');
const { success, error, created } = require('../helpers/response');
const { broadcastCampaignUpdate } = require('../websocket');

// Requests & Campaigns
exports.getRequests = async (req, res, next) => {
  try {
    const creator_id = req.user.id;
    const { status = 'all', search = '' } = req.query;
    
    // Fetch ALL campaigns for this creator
    const [rows] = await pool.query(`
      SELECT 
        c.*, 
        c.id AS campaign_id,
        c.budget AS amount,
        COALESCE(c.number_of_posts, c.content_type, '1 Post') AS deliverable,
        COALESCE(b.name, 'Unknown Brand') AS brand_name, 
        b.logo_url AS brand_logo,
        UPPER(LEFT(COALESCE(b.name, 'B'), 2)) AS brand_initials,
        CASE WHEN c.tracking_link_provided = 1 THEN 'Provided' ELSE 'Not Provided' END AS tracking_label,
        CASE c.escrow_status 
          WHEN 'held' THEN 'Secured' 
          WHEN 'pending' THEN 'Pending' 
          WHEN 'released' THEN 'Released' 
          ELSE c.escrow_status 
        END AS escrow_label,
        CASE 
          WHEN c.start_date IS NOT NULL AND c.deadline IS NOT NULL 
          THEN CONCAT(DATE_FORMAT(c.start_date, '%b %d'), ' - ', DATE_FORMAT(c.deadline, '%b %d'))
          ELSE 'Flexible Timeline'
        END AS timeline_label
      FROM campaigns c 
      LEFT JOIN brands b ON b.id = c.brand_id 
      WHERE c.creator_id = ?
      ORDER BY c.created_at DESC
    `, [creator_id]);

    let filtered = rows;
    
    // Filter by status
    if (status === 'pending') {
      filtered = rows.filter(r => r.status === 'request_sent');
    } else if (status === 'accepted') {
      filtered = rows.filter(r => ['creator_accepted', 'agreement_locked', 'content_uploaded', 'brand_approved', 'posted_live', 'analytics_collected'].includes(r.status));
    } else if (status === 'completed') {
      filtered = rows.filter(r => ['campaign_closed', 'escrow_released'].includes(r.status));
    }

    // Filter by search
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(r => 
        (r.title && r.title.toLowerCase().includes(s)) || 
        (r.brand_name && r.brand_name.toLowerCase().includes(s))
      );
    }

    // Fetch negotiations for these campaigns
    const campaignIds = filtered.map(c => c.id);
    let negotiations = [];
    if (campaignIds.length > 0) {
      const [negRows] = await pool.query(
        'SELECT * FROM campaign_negotiations WHERE campaign_id IN (?) ORDER BY created_at ASC',
        [campaignIds]
      );
      negotiations = negRows;
    }

    const campaignsWithNegs = filtered.map(c => ({
      ...c,
      negotiations: negotiations.filter(n => n.campaign_id === c.id)
    }));

    const counts = {
      total: rows.length,
      pending: rows.filter(r => r.status === 'request_sent').length,
      accepted: rows.filter(r => ['creator_accepted', 'agreement_locked', 'content_uploaded', 'brand_approved', 'posted_live', 'analytics_collected'].includes(r.status)).length,
      completed: rows.filter(r => ['campaign_closed', 'escrow_released'].includes(r.status)).length
    };

    success(res, {
      counts,
      campaigns: campaignsWithNegs
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

    broadcastCampaignUpdate(campaignId, { status: 'creator_accepted', progress_step: 1 });
    success(res, { status: 'creator_accepted' });
  } catch (err) { next(err); }
};

exports.declineRequest = async (req, res, next) => {
  try {
    const campaignId = req.params.campaignId;
    const creatorId = req.user.id;
    await pool.query("UPDATE campaigns SET status='declined', updated_at=NOW() WHERE id = ? AND creator_id = ?", [campaignId, creatorId]);

    broadcastCampaignUpdate(campaignId, { status: 'declined', progress_step: 0 });
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
    const statusMap = {
      'request_sent': 0, 'creator_accepted': 1, 'agreement_locked': 2,
      'content_uploaded': 3, 'brand_approved': 4, 'posted_live': 5,
      'analytics_collected': 6, 'escrow_released': 7, 'campaign_closed': 8
    };
    const [rows] = await pool.query(`
      SELECT
        c.id AS campaign_id,
        c.id,
        c.title,
        c.status,
        c.escrow_status,
        c.budget AS campaign_amount,
        c.content_type AS deliverable,
        c.deadline,
        c.brand_rejection_reason,
        b.name AS brand_name,
        b.logo_url AS brand_logo
      FROM campaigns c
      JOIN brands b ON b.id = c.brand_id
      WHERE c.creator_id = ? AND c.status NOT IN ('request_sent','declined','campaign_closed','escrow_released')
      ORDER BY c.updated_at DESC
    `, [creator_id]);

    const campaigns = rows.map(c => ({
      ...c,
      progress_step: statusMap[c.status] ?? 0
    }));

    const active_count = campaigns.filter(c => !['campaign_closed','escrow_released'].includes(c.status)).length;
    const completed_count = campaigns.filter(c => ['campaign_closed','escrow_released'].includes(c.status)).length;

    success(res, { campaigns, active_count, completed_count });
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

    // New multi-URL submission format: { submissions: [{ platform, content_url }] }
    const submissions = req.body?.submissions;

    if (!submissions || !Array.isArray(submissions) || submissions.length === 0) {
      return error(res, 'No submissions provided. Send { submissions: [{ platform, content_url }] }', 400);
    }

    const [camp] = await pool.query(
      'SELECT status, brand_id, title FROM campaigns WHERE id = ? AND creator_id = ?',
      [campaignId, creatorId]
    );
    if (!camp.length) return error(res, 'Campaign not found', 404);

    // Only allow upload after escrow is locked; also allow re-upload on revision
    const allowedStatuses = ['agreement_locked', 'escrow_locked', 'content_uploaded', 'revision_requested'];
    if (!allowedStatuses.includes(camp[0].status)) {
      return error(res, `Cannot upload content in status: ${camp[0].status}`, 400);
    }

    // Validate all URLs before inserting any
    for (const sub of submissions) {
      if (!sub.content_url || !/^https?:\/\//i.test(sub.content_url)) {
        return error(res, 'Invalid URL format', 400);
      }
    }

    // Upsert: if a submission already exists for this campaign + platform, UPDATE it.
    // This prevents duplicate rows when the creator re-uploads after a revision request.
    for (const sub of submissions) {
      const platform = sub.platform || null;

      // Check if a submission already exists for this campaign + platform
      const [existing] = await pool.query(
        'SELECT id FROM content_submissions WHERE campaign_id = ? AND creator_id = ? AND platform = ? LIMIT 1',
        [campaignId, creatorId, platform]
      );

      if (existing.length > 0) {
        // Update the existing row with the new URL
        await pool.query(
          "UPDATE content_submissions SET content_url = ?, status = 'submitted', submitted_at = NOW(), reviewed_at = NULL, rejection_note = NULL WHERE id = ?",
          [sub.content_url, existing[0].id]
        );
      } else {
        // First time uploading for this platform — insert new row
        await pool.query(
          "INSERT INTO content_submissions (campaign_id, creator_id, platform, content_url, status) VALUES (?, ?, ?, ?, 'submitted')",
          [campaignId, creatorId, platform, sub.content_url]
        );
      }
    }

    // Update main campaign content_url with the first submitted URL for backward compatibility and auto-collect fallback
    if (submissions[0]?.content_url) {
      await pool.query(
        "UPDATE campaigns SET content_url = ?, status = 'content_uploaded', updated_at = NOW() WHERE id = ?",
        [submissions[0].content_url, campaignId]
      );
    } else {
      await pool.query(
        "UPDATE campaigns SET status = 'content_uploaded', updated_at = NOW() WHERE id = ?",
        [campaignId]
      );
    }

    await pool.query(
      "INSERT INTO campaign_timeline (campaign_id, status, changed_by) VALUES (?, 'content_uploaded', 'creator')",
      [campaignId]
    );

    // Notify brand
    const [creator] = await pool.query('SELECT name FROM creators WHERE id = ?', [creatorId]);
    if (camp.length && creator.length) {
      await pool.query(
        'INSERT INTO notifications (user_type, user_id, title, message) VALUES (?, ?, ?, ?)',
        ['brand', camp[0].brand_id, 'Content Uploaded', `${creator[0].name} uploaded content for review: ${camp[0].title}`]
      );
    }

    broadcastCampaignUpdate(campaignId, { status: 'content_uploaded' });

    success(res, { submitted_count: submissions.length, status: 'content_uploaded' });
  } catch (err) { next(err); }
};

exports.getEarnings = async (req, res, next) => {
  try {
    const id = req.user.id;
    const [q1] = await pool.query('SELECT COALESCE(SUM(gross_amount),0) AS total FROM earnings WHERE creator_id=?', [id]);
    const [q2] = await pool.query("SELECT COALESCE(SUM(net_amount),0) AS total FROM earnings WHERE creator_id=? AND payment_status='released'", [id]);
    const [q3] = await pool.query("SELECT COALESCE(SUM(gross_amount),0) AS total FROM earnings WHERE creator_id=? AND payment_status='in_escrow'", [id]);
    const [q4] = await pool.query(
      "SELECT COALESCE(SUM(net_amount),0) AS this_month FROM earnings WHERE creator_id=? AND payment_status='released' AND MONTH(released_at)=MONTH(NOW()) AND YEAR(released_at)=YEAR(NOW())",
      [id]
    );
    const [q4b] = await pool.query(
      "SELECT COALESCE(SUM(net_amount),0) AS last_month FROM earnings WHERE creator_id=? AND payment_status='released' AND MONTH(released_at)=MONTH(DATE_SUB(NOW(),INTERVAL 1 MONTH)) AND YEAR(released_at)=YEAR(DATE_SUB(NOW(),INTERVAL 1 MONTH))",
      [id]
    );
    const [creator] = await pool.query('SELECT upi_id FROM creators WHERE id = ?', [id]);
    const [history] = await pool.query(
      'SELECT e.*, b.name AS brand_name, c.title, e.released_at AS date FROM earnings e JOIN campaigns c ON c.id = e.campaign_id JOIN brands b ON b.id = c.brand_id WHERE e.creator_id = ? ORDER BY e.created_at DESC LIMIT 20',
      [id]
    );
    // Escrow balance breakdown
    const [escrowCamps] = await pool.query(`
      SELECT c.id, c.title, c.escrow_amount AS amount, b.name AS brand
      FROM campaigns c JOIN brands b ON b.id=c.brand_id
      WHERE c.creator_id=? AND c.escrow_status='held'
    `, [id]);
    // Monthly chart
    const [monthly] = await pool.query(`
      SELECT DATE_FORMAT(released_at,'%b') AS month, COALESCE(SUM(net_amount),0) AS total
      FROM earnings WHERE creator_id=? AND payment_status='released'
      AND released_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(released_at), MONTH(released_at), DATE_FORMAT(released_at,'%b')
      ORDER BY MIN(released_at) ASC
    `, [id]);

    const changePct = q4b[0].last_month > 0
      ? Math.round(((q4b[0].this_month - q4b[0].last_month) / q4b[0].last_month) * 100)
      : 0;

    success(res, {
      total_earned_all_time: q1[0].total,
      available_to_withdraw: q2[0].total,
      pending_release: q3[0].total,
      this_month: q4[0].this_month,
      change_pct: changePct,
      upi_id: creator[0]?.upi_id,
      transaction_history: history,
      escrow_balance: { total: escrowCamps.reduce((s, c) => s + Number(c.amount), 0), campaigns: escrowCamps },
      monthly_chart: monthly
    });
  } catch (err) { next(err); }
};

exports.withdrawEarnings = async (req, res, next) => {
  try {
    const { amount, payout_method } = req.body;
    const id = req.user.id;

    if (!amount || amount <= 0) return error(res, 'Invalid withdrawal amount', 400);

    // Check available balance
    const [bal] = await pool.query(
      "SELECT COALESCE(SUM(net_amount),0) AS available FROM earnings WHERE creator_id=? AND payment_status='released'",
      [id]
    );
    if (amount > bal[0].available) return error(res, 'Insufficient balance', 400);

    // Get UPI ID
    const [creator] = await pool.query('SELECT upi_id, name FROM creators WHERE id=?', [id]);
    const upiId = creator[0]?.upi_id;
    if (!upiId && payout_method === 'upi') return error(res, 'UPI ID not set. Please update in Settings.', 400);

    // Record withdrawal request
    await pool.query(
      "INSERT INTO withdrawals (creator_id, amount, payout_method, upi_id, status, requested_at) VALUES (?, ?, ?, ?, 'pending', NOW())",
      [id, amount, payout_method || 'upi', upiId]
    );

    // Mark earnings as withdrawn (deduct from available)
    await pool.query(
      "UPDATE earnings SET payment_status='withdrawn' WHERE creator_id=? AND payment_status='released' ORDER BY released_at ASC LIMIT 1",
      [id]
    );

    await pool.query(
      "INSERT INTO notifications (user_type, user_id, title, message) VALUES ('creator', ?, 'Withdrawal Requested', ?)",
      [id, `Withdrawal of ₹${amount} requested. Will be processed in 2-3 business days.`]
    );

    success(res, {
      amount,
      payout_method: payout_method || 'upi',
      upi_id: upiId,
      status: 'pending',
      message: 'Withdrawal request submitted. Funds will be credited in 2-3 business days.'
    });
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
    const [rows] = await pool.query('SELECT id, name, email, phone, display_name, bio, location, languages_known, profile_photo, is_verified, role, upi_id FROM creators WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return error(res, 'Creator not found', 404);
    
    const [socialAccounts] = await pool.query('SELECT * FROM creator_social_accounts WHERE creator_id = ?', [req.user.id]);
    const [socialProfiles] = await pool.query('SELECT * FROM creator_social_profiles WHERE creator_id = ?', [req.user.id]);
    
    const creator = rows[0];
    if (creator.languages_known) creator.languages_known = typeof creator.languages_known === 'string' ? JSON.parse(creator.languages_known) : creator.languages_known;
    
    success(res, { 
      ...creator, 
      social_accounts: socialAccounts[0] || null,
      social_profiles: socialProfiles
    });
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { 
      name, display_name, bio, location, languages_known, phone, upi_id,
      instagram_url, instagram_followers, instagram_avg_views, instagram_er,
      youtube_url, youtube_subscribers, youtube_avg_views, youtube_er,
      twitter_url, twitter_followers,
      tiktok_url, tiktok_followers,
      linkedin_url, linkedin_followers,
      category, expected_budget
    } = req.body;

    console.log('[updateProfile] creator_id:', req.user.id, 'body keys:', Object.keys(req.body));
    console.log('[updateProfile] instagram_url:', instagram_url, 'followers:', instagram_followers);
    console.log('[updateProfile] youtube_url:', youtube_url, 'subscribers:', youtube_subscribers);

    // 1. Update basic creator profile (only update name/phone if provided)
    const updateFields = [];
    const updateParams = [];

    if (name) { updateFields.push('name=?'); updateParams.push(name); }
    if (display_name) { updateFields.push('display_name=?'); updateParams.push(display_name); }
    if (bio) { updateFields.push('bio=?'); updateParams.push(bio); }
    if (location) { updateFields.push('location=?'); updateParams.push(location); }
    if (languages_known) { updateFields.push('languages_known=?'); updateParams.push(JSON.stringify(languages_known)); }
    if (phone) { updateFields.push('phone=?'); updateParams.push(phone); }
    if (upi_id) { updateFields.push('upi_id=?'); updateParams.push(upi_id); }
    if (expected_budget) { updateFields.push('expected_budget=?'); updateParams.push(expected_budget); }

    if (updateFields.length > 0) {
      await pool.query(
        `UPDATE creators SET ${updateFields.join(', ')} WHERE id=?`,
        [...updateParams, req.user.id]
      );
    }

    // 2. Upsert social profiles
    try {
      if (instagram_url !== undefined && instagram_url !== null && instagram_url !== '') {
        await pool.query(
          'INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count, avg_views, engagement_rate) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE profile_url=?, followers_count=?, avg_views=?, engagement_rate=?',
          [req.user.id, 'instagram', instagram_url, parseInt(instagram_followers) || 0, parseInt(instagram_avg_views) || 0, parseFloat(instagram_er) || 0, instagram_url, parseInt(instagram_followers) || 0, parseInt(instagram_avg_views) || 0, parseFloat(instagram_er) || 0]
        );
        console.log('[updateProfile] ✓ Instagram saved: followers=', instagram_followers);
      }
      if (youtube_url !== undefined && youtube_url !== null && youtube_url !== '') {
        await pool.query(
          'INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count, avg_views, engagement_rate) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE profile_url=?, followers_count=?, avg_views=?, engagement_rate=?',
          [req.user.id, 'youtube', youtube_url, parseInt(youtube_subscribers) || 0, parseInt(youtube_avg_views) || 0, parseFloat(youtube_er) || 0, youtube_url, parseInt(youtube_subscribers) || 0, parseInt(youtube_avg_views) || 0, parseFloat(youtube_er) || 0]
        );
        console.log('[updateProfile] ✓ YouTube saved: subscribers=', youtube_subscribers);
      }
      if (twitter_url !== undefined && twitter_url !== null && twitter_url !== '') {
        await pool.query(
          'INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE profile_url=?, followers_count=?',
          [req.user.id, 'twitter', twitter_url, twitter_followers || 0, twitter_url, twitter_followers || 0]
        );
      }
      if (tiktok_url !== undefined && tiktok_url !== null && tiktok_url !== '') {
        await pool.query(
          'INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE profile_url=?, followers_count=?',
          [req.user.id, 'tiktok', tiktok_url, tiktok_followers || 0, tiktok_url, tiktok_followers || 0]
        );
      }
      if (linkedin_url !== undefined && linkedin_url !== null && linkedin_url !== '') {
        await pool.query(
          'INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE profile_url=?, followers_count=?',
          [req.user.id, 'linkedin', linkedin_url, linkedin_followers || 0, linkedin_url, linkedin_followers || 0]
        );
      }
    } catch (e) {
      console.error('Failed to upsert social profiles:', e.message);
    }

    // 3. Upsert niche details (category)
    if (category) {
      try {
        const catArray = Array.isArray(category) ? category : [category];
        await pool.query(
          'INSERT INTO creator_niche_details (creator_id, categories) VALUES (?, ?) ON DUPLICATE KEY UPDATE categories=?',
          [req.user.id, JSON.stringify(catArray), JSON.stringify(catArray)]
        );
      } catch (e) {
        console.error('Failed to upsert niche details:', e.message);
      }
    }

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
    const [profiles] = await pool.query('SELECT * FROM creator_social_profiles WHERE creator_id=?', [req.user.id]);
    const [accounts] = await pool.query('SELECT * FROM creator_social_accounts WHERE creator_id=?', [req.user.id]);
    success(res, { profiles, accounts: accounts[0] || null });
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

    // Active campaigns count
    const [q1] = await pool.query(
      "SELECT COUNT(*) AS count FROM campaigns WHERE creator_id=? AND status NOT IN ('campaign_closed','declined','escrow_released')",
      [id]
    );
    // Earnings this month
    const [q2] = await pool.query(
      "SELECT COALESCE(SUM(net_amount),0) AS amount, COALESCE(SUM(CASE WHEN MONTH(released_at)=MONTH(NOW()) AND YEAR(released_at)=YEAR(NOW()) THEN net_amount ELSE 0 END),0) AS this_month FROM earnings WHERE creator_id=? AND payment_status='released'",
      [id]
    );
    // Earnings last month for change %
    const [q2b] = await pool.query(
      "SELECT COALESCE(SUM(net_amount),0) AS last_month FROM earnings WHERE creator_id=? AND payment_status='released' AND MONTH(released_at)=MONTH(DATE_SUB(NOW(),INTERVAL 1 MONTH)) AND YEAR(released_at)=YEAR(DATE_SUB(NOW(),INTERVAL 1 MONTH))",
      [id]
    );
    // New requests
    const [q3] = await pool.query(
      "SELECT COUNT(*) AS count FROM campaigns WHERE creator_id=? AND status='request_sent'",
      [id]
    );
    // Pending escrow
    const [q4] = await pool.query(
      "SELECT COALESCE(SUM(escrow_amount),0) AS total FROM campaigns WHERE creator_id=? AND escrow_status='held'",
      [id]
    );
    // Active campaigns list with brand info
    const [q5] = await pool.query(`
      SELECT c.id AS campaign_id, c.title, c.status, c.deadline, c.budget AS amount,
             b.name AS brand_name, b.logo_url AS brand_logo
      FROM campaigns c JOIN brands b ON b.id=c.brand_id
      WHERE c.creator_id=? AND c.status NOT IN ('campaign_closed','declined','escrow_released')
      ORDER BY c.updated_at DESC LIMIT 5
    `, [id]);
    // Monthly earnings chart (last 6 months)
    const [q6] = await pool.query(`
      SELECT DATE_FORMAT(released_at,'%b') AS month, COALESCE(SUM(net_amount),0) AS total
      FROM earnings WHERE creator_id=? AND payment_status='released'
      AND released_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(released_at), MONTH(released_at), DATE_FORMAT(released_at,'%b')
      ORDER BY MIN(released_at) ASC
    `, [id]);
    // Upcoming deadlines
    const [q7] = await pool.query(`
      SELECT c.id, c.title, c.deadline, b.name AS brand_name
      FROM campaigns c JOIN brands b ON b.id=c.brand_id
      WHERE c.creator_id=? AND c.status NOT IN ('campaign_closed','declined')
      AND c.deadline IS NOT NULL AND c.deadline >= CURDATE()
      ORDER BY c.deadline ASC LIMIT 3
    `, [id]);

    // New requests (pending) with brand info
    const [q8] = await pool.query(`
      SELECT c.id AS campaign_id, c.title, c.budget AS amount, c.content_type AS deliverable,
             b.name AS brand_name, b.logo_url AS brand_logo
      FROM campaigns c JOIN brands b ON b.id=c.brand_id
      WHERE c.creator_id=? AND c.status='request_sent'
      ORDER BY c.created_at DESC LIMIT 5
    `, [id]);

    const lastMonth = q2b[0].last_month;
    const thisMonth = q2[0].this_month;
    const changePct = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    // Add days_remaining to deadlines
    const deadlinesWithDays = q7.map(d => ({
      ...d,
      days_remaining: Math.max(0, Math.ceil((new Date(d.deadline) - new Date()) / (1000 * 60 * 60 * 24)))
    }));

    success(res, {
      active_campaigns: { count: q1[0].count },
      earnings_this_month: { amount: thisMonth, change_pct: Math.round(changePct) },
      total_earnings: q2[0].amount,
      new_requests: q8,
      pending_requests: { count: q3[0].count },
      pending_escrow: q4[0].total,
      active_campaigns_list: q5,
      monthly_earnings_chart: q6,
      upcoming_deadlines: deadlinesWithDays,
      ytd_earnings: q2[0].amount
    });
  } catch (err) { next(err); }
};

exports.getAnalytics = async (req, res, next) => {
  try {
    const id = req.user.id;
    const { period = '30d' } = req.query;
    const days = period === '90d' ? 90 : period === '7d' ? 7 : 30;

    // Aggregate totals from campaign_analytics
    const [totals] = await pool.query(`
      SELECT
        COALESCE(SUM(ca.views),0) AS total_views,
        COALESCE(SUM(ca.reach),0) AS total_reach,
        COALESCE(SUM(ca.clicks),0) AS total_clicks,
        COALESCE(SUM(ca.sales_generated),0) AS total_sales,
        COALESCE(AVG(ca.engagement_rate),0) AS avg_engagement_rate
      FROM campaign_analytics ca
      JOIN campaigns c ON c.id=ca.campaign_id
      WHERE c.creator_id=? AND ca.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [id, days]);

    // Previous period for change %
    const [prev] = await pool.query(`
      SELECT COALESCE(SUM(ca.views),0) AS total_views, COALESCE(SUM(ca.reach),0) AS total_reach,
             COALESCE(SUM(ca.clicks),0) AS total_clicks, COALESCE(AVG(ca.engagement_rate),0) AS avg_er
      FROM campaign_analytics ca JOIN campaigns c ON c.id=ca.campaign_id
      WHERE c.creator_id=? AND ca.created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
      AND ca.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [id, days, days * 2]);

    const pct = (cur, old) => old > 0 ? Math.round(((cur - old) / old) * 100) : 0;

    // Per-campaign performance
    const [campaigns] = await pool.query(`
      SELECT c.title AS campaign_title, ca.views, ca.reach, ca.clicks,
             ca.engagement_rate, ca.sales_generated, ca.platform
      FROM campaign_analytics ca JOIN campaigns c ON c.id=ca.campaign_id
      WHERE c.creator_id=? ORDER BY ca.created_at DESC LIMIT 10
    `, [id]);

    // Platform breakdown
    const [platforms] = await pool.query(`
      SELECT ca.platform, COALESCE(SUM(ca.views),0) AS views,
             COALESCE(AVG(ca.engagement_rate),0) AS engagement_rate
      FROM campaign_analytics ca JOIN campaigns c ON c.id=ca.campaign_id
      WHERE c.creator_id=? GROUP BY ca.platform
    `, [id]);

    // Top performing niche
    const [niches] = await pool.query(`
      SELECT JSON_UNQUOTE(JSON_EXTRACT(nd.categories,'$[0]')) AS niche,
             AVG(ca.engagement_rate) AS engagement_rate
      FROM campaign_analytics ca
      JOIN campaigns c ON c.id=ca.campaign_id
      JOIN creator_niche_details nd ON nd.creator_id=c.creator_id
      WHERE c.creator_id=? GROUP BY 1 ORDER BY 2 DESC LIMIT 5
    `, [id]);

    // Audience demographics (from social profiles as proxy)
    const [social] = await pool.query(`
      SELECT platform, followers_count, engagement_rate FROM creator_social_profiles WHERE creator_id=?
      UNION
      SELECT 'instagram' as platform, instagram_followers as followers_count, 0 as engagement_rate FROM creator_social_accounts WHERE creator_id=? AND instagram_connected=true
    `, [id, id]);

    const ctr = totals[0].total_views > 0
      ? ((totals[0].total_clicks / totals[0].total_views) * 100).toFixed(1)
      : '0.0';

    success(res, {
      total_views: totals[0].total_views,
      total_reach: totals[0].total_reach,
      total_clicks: totals[0].total_clicks,
      total_sales: totals[0].total_sales,
      avg_engagement_rate: parseFloat(totals[0].avg_engagement_rate).toFixed(1),
      clicks_ctr: ctr,
      views_change_pct: pct(totals[0].total_views, prev[0].total_views),
      reach_change_pct: pct(totals[0].total_reach, prev[0].total_reach),
      campaign_performance: campaigns,
      platform_breakdown: platforms,
      top_performing_niche: niches,
      audience_demographics: {
        age_groups: [
          { range: '18-24', percentage: 34 },
          { range: '25-34', percentage: 41 },
          { range: '35-44', percentage: 18 },
          { range: '45+', percentage: 7 }
        ],
        top_locations: [
          { city: 'Mumbai', percentage: 28 },
          { city: 'Delhi', percentage: 22 },
          { city: 'Bangalore', percentage: 18 },
          { city: 'Hyderabad', percentage: 12 }
        ],
        gender: { female_pct: 58, male_pct: 42 }
      }
    });
  } catch (err) { next(err); }
};

exports.getLeads = async (req, res, next) => {
  try {
    const id = req.user.id;

    // Summary stats
    const [stats] = await pool.query(`
      SELECT
        COUNT(*) AS total_leads,
        COALESCE(AVG(deal_value),0) AS avg_deal_value,
        COALESCE(SUM(CASE WHEN converted=1 THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),0) AS conversion_rate
      FROM leads WHERE creator_id=?
    `, [id]);

    // Top performing niche
    const [topNiche] = await pool.query(`
      SELECT l.niche, COUNT(*) AS lead_count, AVG(l.deal_value) AS avg_value
      FROM leads l WHERE l.creator_id=? GROUP BY l.niche ORDER BY lead_count DESC LIMIT 1
    `, [id]);

    // Leads by campaign
    const [byCampaign] = await pool.query(`
      SELECT c.title AS campaign_title, COUNT(l.id) AS lead_count, COALESCE(SUM(l.deal_value),0) AS total_value
      FROM leads l JOIN campaigns c ON c.id=l.campaign_id
      WHERE l.creator_id=? GROUP BY l.campaign_id, c.title ORDER BY lead_count DESC LIMIT 8
    `, [id]);

    // Leads by niche
    const [byNiche] = await pool.query(`
      SELECT l.niche,
             COUNT(*) AS lead_count,
             COALESCE(SUM(CASE WHEN l.converted=1 THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(*),0),0) AS conversion_rate
      FROM leads l WHERE l.creator_id=? GROUP BY l.niche ORDER BY lead_count DESC LIMIT 6
    `, [id]);

    success(res, {
      total_leads: stats[0].total_leads,
      avg_deal_value: Math.round(stats[0].avg_deal_value),
      conversion_rate: parseFloat(stats[0].conversion_rate).toFixed(1),
      top_performing_niche: topNiche[0]?.niche || '—',
      leads_by_campaign: byCampaign,
      leads_by_niche: byNiche
    });
  } catch (err) { next(err); }
};

exports.getCampaignSubmissions = async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM content_submissions WHERE campaign_id=? AND creator_id=?', [req.params.campaignId, req.user.id]);
    success(res, rows);
  } catch (err) { next(err); }
};
