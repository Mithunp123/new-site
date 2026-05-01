import pool from '../config/db.js';
import bcrypt from 'bcrypt';

export async function addSocialProfile(req, res) {
  try {
    const creatorId = req.user.id;
    const { platform, profile_url, followers_count, avg_views, engagement_rate, audience_location } = req.body;

    await pool.execute(
      `INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count, avg_views, engagement_rate, audience_location)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [creatorId, platform, profile_url, followers_count || 0, avg_views || 0, engagement_rate || 0, audience_location || null]
    );

    res.status(201).json({ message: 'Social profile added successfully.' });
  } catch (error) {
    console.error('Add social profile error:', error);
    res.status(500).json({ error: 'Failed to add social profile.' });
  }
}

export async function addNicheDetails(req, res) {
  try {
    const creatorId = req.user.id;
    const { categories, subcategories, worked_with_brands, performance_metrics } = req.body;
    const screenshots = req.files ? req.files.map(f => f.path) : [];

    await pool.execute(
      `INSERT INTO creator_niche_details (creator_id, categories, subcategories, worked_with_brands, performance_metrics, screenshots_testimonials)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE categories = VALUES(categories), subcategories = VALUES(subcategories),
       worked_with_brands = VALUES(worked_with_brands), performance_metrics = VALUES(performance_metrics),
       screenshots_testimonials = VALUES(screenshots_testimonials)`,
      [
        creatorId,
        JSON.stringify(categories || []),
        JSON.stringify(subcategories || []),
        JSON.stringify(worked_with_brands || []),
        JSON.stringify(performance_metrics || {}),
        JSON.stringify(screenshots)
      ]
    );

    res.status(201).json({ message: 'Niche details saved successfully.' });
  } catch (error) {
    console.error('Add niche details error:', error);
    res.status(500).json({ error: 'Failed to save niche details.' });
  }
}

export async function addPortfolio(req, res) {
  try {
    const creatorId = req.user.id;
    const { sample_links, collaboration_preference } = req.body;

    await pool.execute(
      `INSERT INTO creator_portfolio (creator_id, sample_links, collaboration_preference)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE sample_links = VALUES(sample_links), collaboration_preference = VALUES(collaboration_preference)`,
      [creatorId, JSON.stringify(sample_links || []), collaboration_preference || 'paid']
    );

    res.status(201).json({ message: 'Portfolio saved successfully.' });
  } catch (error) {
    console.error('Add portfolio error:', error);
    res.status(500).json({ error: 'Failed to save portfolio.' });
  }
}

export async function getProfile(req, res) {
  try {
    const creatorId = req.user.id;

    const [creators] = await pool.execute(
      'SELECT id, name, email, phone, display_name, bio, location, languages_known, profile_photo, role, is_verified, created_at FROM creators WHERE id = ? AND is_active = true',
      [creatorId]
    );

    if (creators.length === 0) {
      return res.status(404).json({ error: 'Creator not found.' });
    }

    const [socialProfiles] = await pool.execute(
      'SELECT * FROM creator_social_profiles WHERE creator_id = ?',
      [creatorId]
    );

    const [nicheDetails] = await pool.execute(
      'SELECT * FROM creator_niche_details WHERE creator_id = ?',
      [creatorId]
    );

    const [portfolio] = await pool.execute(
      'SELECT * FROM creator_portfolio WHERE creator_id = ?',
      [creatorId]
    );

    res.json({
      ...creators[0],
      social_profiles: socialProfiles,
      niche_details: nicheDetails[0] || null,
      portfolio: portfolio[0] || null
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile.' });
  }
}

export async function updateProfile(req, res) {
  try {
    const creatorId = req.user.id;
    const { name, display_name, bio, location, languages_known, phone } = req.body;

    await pool.execute(
      `UPDATE creators SET name = COALESCE(?, name), display_name = COALESCE(?, display_name),
       bio = COALESCE(?, bio), location = COALESCE(?, location),
       languages_known = COALESCE(?, languages_known), phone = COALESCE(?, phone)
       WHERE id = ?`,
      [name, display_name, bio, location, languages_known ? JSON.stringify(languages_known) : null, phone, creatorId]
    );

    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
}

export async function updateProfilePhoto(req, res) {
  try {
    const creatorId = req.user.id;
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded.' });
    }

    const photoPath = req.file.path;
    await pool.execute('UPDATE creators SET profile_photo = ? WHERE id = ?', [photoPath, creatorId]);

    res.json({ message: 'Profile photo updated.', profile_photo: photoPath });
  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({ error: 'Failed to update profile photo.' });
  }
}

export async function updatePassword(req, res) {
  try {
    const creatorId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ error: 'Both current and new password are required.' });
    }

    const [users] = await pool.execute('SELECT password_hash FROM creators WHERE id = ?', [creatorId]);
    const valid = await bcrypt.compare(current_password, users[0].password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.execute('UPDATE creators SET password_hash = ? WHERE id = ?', [newHash, creatorId]);

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Failed to update password.' });
  }
}

export async function deleteAccount(req, res) {
  try {
    const creatorId = req.user.id;
    await pool.execute('UPDATE creators SET is_active = false WHERE id = ?', [creatorId]);
    res.json({ message: 'Account deactivated successfully.' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account.' });
  }
}

export async function getDashboard(req, res) {
  try {
    const creatorId = req.user.id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    // Earnings this month
    const [thisMonthEarnings] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM earnings
       WHERE creator_id = ? AND payment_status IN ('in_escrow', 'released')
       AND MONTH(created_at) = ? AND YEAR(created_at) = ?`,
      [creatorId, currentMonth, currentYear]
    );

    // Earnings last month
    const [lastMonthEarnings] = await pool.execute(
      `SELECT COALESCE(SUM(amount), 0) as total FROM earnings
       WHERE creator_id = ? AND payment_status IN ('in_escrow', 'released')
       AND MONTH(created_at) = ? AND YEAR(created_at) = ?`,
      [creatorId, lastMonth, lastMonthYear]
    );

    // Active campaigns
    const [activeCampaigns] = await pool.execute(
      `SELECT c.*, b.name as brand_name, b.logo_url as brand_logo FROM campaigns c
       JOIN brands b ON c.brand_id = b.id
       WHERE c.creator_id = ? AND c.status NOT IN ('campaign_closed', 'escrow_released')
       ORDER BY c.deadline ASC LIMIT 5`,
      [creatorId]
    );

    // Active campaigns count
    const [activeCount] = await pool.execute(
      `SELECT COUNT(*) as count FROM campaigns
       WHERE creator_id = ? AND status NOT IN ('campaign_closed', 'escrow_released')`,
      [creatorId]
    );

    // Deadline soon (within 7 days)
    const [deadlineSoon] = await pool.execute(
      `SELECT COUNT(*) as count FROM campaigns
       WHERE creator_id = ? AND status NOT IN ('campaign_closed', 'escrow_released')
       AND deadline BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
      [creatorId]
    );

    // Pending requests
    const [pendingRequests] = await pool.execute(
      `SELECT COUNT(*) as count FROM campaigns WHERE creator_id = ? AND status = 'request_sent'`,
      [creatorId]
    );

    // Monthly earnings (last 7 months)
    const monthlyEarnings = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const [row] = await pool.execute(
        `SELECT COALESCE(SUM(amount), 0) as total FROM earnings
         WHERE creator_id = ? AND MONTH(created_at) = ? AND YEAR(created_at) = ?`,
        [creatorId, m, y]
      );
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthlyEarnings.push({ month: monthNames[m - 1], total: Number(row[0].total) });
    }

    // New requests
    const [newRequests] = await pool.execute(
      `SELECT c.id, c.title, c.deliverable, c.escrow_amount, c.respond_by, b.name as brand_name, b.logo_url
       FROM campaigns c JOIN brands b ON c.brand_id = b.id
       WHERE c.creator_id = ? AND c.status = 'request_sent'
       ORDER BY c.created_at DESC LIMIT 2`,
      [creatorId]
    );

    // Upcoming deadlines
    const [upcomingDeadlines] = await pool.execute(
      `SELECT c.title as campaign_title, c.deliverable as description, c.deadline,
              DATEDIFF(c.deadline, CURDATE()) as days_remaining, b.name as brand_name
       FROM campaigns c JOIN brands b ON c.brand_id = b.id
       WHERE c.creator_id = ? AND c.status NOT IN ('campaign_closed', 'escrow_released')
       AND c.deadline >= CURDATE()
       ORDER BY c.deadline ASC LIMIT 3`,
      [creatorId]
    );

    const earningsThisMonth = Number(thisMonthEarnings[0].total);
    const earningsLastMonth = Number(lastMonthEarnings[0].total);
    const changePercent = earningsLastMonth > 0
      ? Math.round(((earningsThisMonth - earningsLastMonth) / earningsLastMonth) * 100)
      : 0;

    res.json({
      earnings_this_month: earningsThisMonth,
      earnings_last_month: earningsLastMonth,
      earnings_change_pct: changePercent,
      active_campaigns_count: activeCount[0].count,
      active_campaigns_deadline_soon: deadlineSoon[0].count,
      pending_requests_count: pendingRequests[0].count,
      profile_views_7d: 128,
      active_campaigns: activeCampaigns.map(c => ({
        id: c.id,
        brand_name: c.brand_name,
        brand_logo: c.brand_logo,
        title: c.title,
        deliverable: c.deliverable,
        due_date: c.deadline,
        amount: Number(c.escrow_amount),
        status: c.status
      })),
      monthly_earnings: monthlyEarnings,
      new_requests: newRequests.map(r => ({
        id: r.id,
        brand_name: r.brand_name,
        brand_logo: r.logo_url,
        campaign_type: r.deliverable,
        amount: Number(r.escrow_amount),
        respond_by: r.respond_by
      })),
      upcoming_deadlines: upcomingDeadlines.map(d => ({
        brand_name: d.brand_name,
        campaign_title: d.campaign_title,
        description: d.description,
        deadline: d.deadline,
        days_remaining: d.days_remaining
      }))
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data.' });
  }
}
