import pool from './db.js';
import bcrypt from 'bcrypt';

export async function seedDatabase() {
  try {
    // Check if data already exists
    const [existing] = await pool.execute('SELECT COUNT(*) as count FROM creators');
    if (existing[0].count > 0) {
      console.log('ℹ️  Database already seeded, skipping...');
      return;
    }

    console.log('🌱 Seeding database...');

    // Create demo creator
    const passwordHash = await bcrypt.hash('password123', 10);
    const [creatorResult] = await pool.execute(
      `INSERT INTO creators (name, email, phone, password_hash, display_name, bio, location, languages_known, role, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Priya Sharma',
        'priya@gmail.com',
        '+91 9876543210',
        passwordHash,
        'Priya Sharma',
        'Beauty & lifestyle content creator with 5+ years of experience. Passionate about authentic brand storytelling and engaging audiences through creative video content.',
        'Mumbai, India',
        JSON.stringify(['English', 'Hindi', 'Marathi']),
        'creator',
        true
      ]
    );
    const creatorId = creatorResult.insertId;

    // Create admin user
    const adminHash = await bcrypt.hash('admin123', 10);
    await pool.execute(
      `INSERT INTO creators (name, email, phone, password_hash, display_name, role, is_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ['Admin User', 'admin@gradix.com', '+91 9000000000', adminHash, 'Admin', 'admin', true]
    );

    // Social profiles
    const socialProfiles = [
      [creatorId, 'instagram', 'https://instagram.com/priyasharma', 245000, 85000, 6.20, 'Mumbai, Delhi'],
      [creatorId, 'youtube', 'https://youtube.com/@priyasharma', 128000, 45000, 4.80, 'Mumbai, Bangalore'],
      [creatorId, 'tiktok', 'https://tiktok.com/@priyasharma', 89000, 120000, 8.10, 'Pan India'],
      [creatorId, 'twitter', 'https://twitter.com/priyasharma', 34000, 12000, 3.20, 'Mumbai']
    ];

    for (const profile of socialProfiles) {
      await pool.execute(
        `INSERT INTO creator_social_profiles (creator_id, platform, profile_url, followers_count, avg_views, engagement_rate, audience_location)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        profile
      );
    }

    // Niche details
    await pool.execute(
      `INSERT INTO creator_niche_details (creator_id, categories, subcategories, worked_with_brands, performance_metrics)
       VALUES (?, ?, ?, ?, ?)`,
      [
        creatorId,
        JSON.stringify(['Beauty', 'Fashion', 'Lifestyle', 'Food']),
        JSON.stringify(['Skincare', 'Makeup', 'Street Fashion', 'Travel']),
        JSON.stringify(['Nykaa', 'Zomato', 'Myntra', 'boAt', 'Swiggy', 'Mamaearth']),
        JSON.stringify({ avg_views: 85000, avg_engagement: 6.2, total_campaigns: 15 })
      ]
    );

    // Portfolio
    await pool.execute(
      `INSERT INTO creator_portfolio (creator_id, sample_links, collaboration_preference)
       VALUES (?, ?, ?)`,
      [
        creatorId,
        JSON.stringify([
          'https://instagram.com/reel/abc123',
          'https://youtube.com/watch?v=xyz789',
          'https://instagram.com/reel/def456'
        ]),
        'both'
      ]
    );

    // Brands
    const brands = [
      ['Zomato', '/logos/zomato.png', 'Food & Delivery'],
      ['boAt', '/logos/boat.png', 'Electronics'],
      ['Myntra', '/logos/myntra.png', 'Fashion'],
      ['Swiggy', '/logos/swiggy.png', 'Food & Delivery'],
      ['Nykaa', '/logos/nykaa.png', 'Beauty'],
      ['Mamaearth', '/logos/mamaearth.png', 'Beauty & Wellness']
    ];

    const brandIds = {};
    for (const brand of brands) {
      const [result] = await pool.execute(
        'INSERT INTO brands (name, logo_url, category) VALUES (?, ?, ?)',
        brand
      );
      brandIds[brand[0]] = result.insertId;
    }

    // Campaigns (mix of statuses)
    const campaigns = [
      {
        brand: 'Zomato', title: 'Binge Season Campaign', deliverable: '1 Reel + 2 Stories',
        brief: 'Create engaging content showcasing Zomato\'s new "Binge Season" campaign. Focus on food ordering experience, delivery speed, and exclusive offers. The content should feel authentic and relatable to your audience. Include a clear CTA directing viewers to download/open the Zomato app.',
        tracking_link: 'https://zmt.to/priya-binge', deadline: '2026-05-15',
        status: 'content_uploaded', escrow_amount: 22000, escrow_status: 'held', respond_by: '2026-05-01'
      },
      {
        brand: 'boAt', title: 'Rockerz Launch', deliverable: '1 YouTube Video',
        brief: 'Review the new boAt Rockerz 551ANC headphones. Highlight noise cancellation, battery life, and design. Target Gen-Z audience.',
        tracking_link: 'https://boat.link/priya', deadline: '2026-05-08',
        status: 'creator_accepted', escrow_amount: 18000, escrow_status: 'held', respond_by: '2026-04-30'
      },
      {
        brand: 'Myntra', title: 'Winter Fashion Haul', deliverable: '2 Reels + 1 Blog',
        brief: 'Create a winter fashion haul featuring Myntra\'s top winter collection. Showcase at least 5 outfits with styling tips.',
        tracking_link: 'https://myntra.link/priya', deadline: '2026-05-20',
        status: 'agreement_locked', escrow_amount: 15000, escrow_status: 'held', respond_by: '2026-05-05'
      },
      {
        brand: 'Nykaa', title: 'Summer Skincare Routine', deliverable: '1 Reel + 1 Story',
        brief: 'Share your summer skincare routine featuring Nykaa products. Focus on SPF importance and hydration.',
        tracking_link: 'https://nykaa.link/priya', deadline: '2026-05-02',
        status: 'request_sent', escrow_amount: 12000, escrow_status: 'pending', respond_by: '2026-05-03'
      },
      {
        brand: 'Swiggy', title: 'Instamart Convenience', deliverable: '1 Reel',
        brief: 'Showcase Swiggy Instamart\'s quick delivery for everyday essentials. Make it relatable and fun.',
        tracking_link: 'https://swiggy.link/priya', deadline: '2026-05-10',
        status: 'request_sent', escrow_amount: 8000, escrow_status: 'pending', respond_by: '2026-05-04'
      },
      {
        brand: 'Mamaearth', title: 'Natural Beauty Campaign', deliverable: '1 Video + 3 Stories',
        brief: 'Promote Mamaearth\'s new vitamin C range. Highlight natural ingredients and visible results.',
        tracking_link: 'https://mama.link/priya', deadline: '2026-05-12',
        status: 'request_sent', escrow_amount: 14000, escrow_status: 'pending', respond_by: '2026-05-05'
      },
      // Completed campaigns
      {
        brand: 'Zomato', title: 'Food Festival Promo', deliverable: '2 Reels',
        brief: 'Previous completed campaign for Zomato food festival.',
        tracking_link: 'https://zmt.to/priya-fest', deadline: '2026-03-15',
        status: 'campaign_closed', escrow_amount: 20000, escrow_status: 'released', respond_by: '2026-03-01'
      },
      {
        brand: 'boAt', title: 'Airdopes Review', deliverable: '1 YouTube Video',
        brief: 'Review of boAt Airdopes.',
        tracking_link: 'https://boat.link/priya2', deadline: '2026-02-20',
        status: 'campaign_closed', escrow_amount: 16000, escrow_status: 'released', respond_by: '2026-02-05'
      },
      {
        brand: 'Myntra', title: 'EORS Sale Campaign', deliverable: '1 Reel + Stories',
        brief: 'End of reason sale promotion.',
        tracking_link: 'https://myntra.link/priya2', deadline: '2026-01-30',
        status: 'campaign_closed', escrow_amount: 14000, escrow_status: 'released', respond_by: '2026-01-15'
      },
      {
        brand: 'Nykaa', title: 'Pink Friday Sale', deliverable: '2 Reels',
        brief: 'Pink Friday sale promotion.',
        tracking_link: 'https://nykaa.link/priya2', deadline: '2026-03-28',
        status: 'escrow_released', escrow_amount: 18000, escrow_status: 'released', respond_by: '2026-03-15'
      },
      {
        brand: 'Swiggy', title: 'Match Day Meals', deliverable: '1 Reel',
        brief: 'IPL season food ordering campaign.',
        tracking_link: 'https://swiggy.link/priya2', deadline: '2026-04-10',
        status: 'campaign_closed', escrow_amount: 10000, escrow_status: 'released', respond_by: '2026-03-25'
      },
      {
        brand: 'Mamaearth', title: 'Hair Care Range', deliverable: '1 Video',
        brief: 'Hair care product review.',
        tracking_link: 'https://mama.link/priya2', deadline: '2026-02-28',
        status: 'campaign_closed', escrow_amount: 12000, escrow_status: 'released', respond_by: '2026-02-10'
      }
    ];

    const campaignIds = [];
    for (const c of campaigns) {
      const [result] = await pool.execute(
        `INSERT INTO campaigns (brand_id, creator_id, title, deliverable, brief, tracking_link, deadline, status, escrow_amount, escrow_status, respond_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [brandIds[c.brand], creatorId, c.title, c.deliverable, c.brief, c.tracking_link, c.deadline, c.status, c.escrow_amount, c.escrow_status, c.respond_by]
      );
      campaignIds.push({ id: result.insertId, ...c });
    }

    // Campaign analytics
    const analyticsData = [
      { campaignTitle: 'Binge Season Campaign', views: 185000, reach: 142000, clicks: 3400, conversions: 420, sales: 84000, engagement: 7.2, platform: 'instagram' },
      { campaignTitle: 'Rockerz Launch', views: 124000, reach: 98000, clicks: 2100, conversions: 180, sales: 54000, engagement: 5.8, platform: 'youtube' },
      { campaignTitle: 'Winter Fashion Haul', views: 96000, reach: 78000, clicks: 1800, conversions: 150, sales: 37500, engagement: 6.1, platform: 'instagram' },
      { campaignTitle: 'Food Festival Promo', views: 210000, reach: 165000, clicks: 4200, conversions: 520, sales: 104000, engagement: 8.4, platform: 'instagram' },
      { campaignTitle: 'Airdopes Review', views: 156000, reach: 120000, clicks: 2800, conversions: 240, sales: 72000, engagement: 5.2, platform: 'youtube' },
      { campaignTitle: 'EORS Sale Campaign', views: 88000, reach: 72000, clicks: 1600, conversions: 130, sales: 32500, engagement: 5.9, platform: 'instagram' },
      { campaignTitle: 'Pink Friday Sale', views: 134000, reach: 108000, clicks: 2600, conversions: 310, sales: 93000, engagement: 7.8, platform: 'instagram' },
      { campaignTitle: 'Match Day Meals', views: 76000, reach: 58000, clicks: 1200, conversions: 95, sales: 19000, engagement: 4.8, platform: 'instagram' }
    ];

    for (const a of analyticsData) {
      const campaign = campaignIds.find(c => c.title === a.campaignTitle);
      if (campaign) {
        await pool.execute(
          `INSERT INTO campaign_analytics (campaign_id, views, reach, clicks, conversions, sales_generated, engagement_rate, cost_per_conversion, platform)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [campaign.id, a.views, a.reach, a.clicks, a.conversions, a.sales, a.engagement, (a.sales / (a.conversions || 1)).toFixed(2), a.platform]
        );
      }
    }

    // Earnings
    const earningsData = [
      { campaign: 'Food Festival Promo', amount: 20000, status: 'released', released: '2026-03-20' },
      { campaign: 'Airdopes Review', amount: 16000, status: 'released', released: '2026-02-25' },
      { campaign: 'EORS Sale Campaign', amount: 14000, status: 'released', released: '2026-02-05' },
      { campaign: 'Pink Friday Sale', amount: 18000, status: 'released', released: '2026-04-02' },
      { campaign: 'Match Day Meals', amount: 10000, status: 'released', released: '2026-04-15' },
      { campaign: 'Hair Care Range', amount: 12000, status: 'released', released: '2026-03-05' },
      { campaign: 'Binge Season Campaign', amount: 22000, status: 'in_escrow', released: null },
      { campaign: 'Rockerz Launch', amount: 18000, status: 'in_escrow', released: null },
      { campaign: 'Winter Fashion Haul', amount: 15000, status: 'in_escrow', released: null }
    ];

    for (const e of earningsData) {
      const campaign = campaignIds.find(c => c.title === e.campaign);
      if (campaign) {
        await pool.execute(
          `INSERT INTO earnings (creator_id, campaign_id, amount, payment_status, payout_method, released_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [creatorId, campaign.id, e.amount, e.status, 'UPI — priya@paytm', e.released]
        );
      }
    }

    // Leads
    const leadsData = [];
    const niches = ['Beauty', 'Fashion', 'Food', 'Tech'];
    for (const campaign of campaignIds) {
      const leadCount = Math.floor(Math.random() * 100) + 20;
      for (let i = 0; i < leadCount; i++) {
        const niche = niches[Math.floor(Math.random() * niches.length)];
        const dealValue = Math.floor(Math.random() * 3000) + 500;
        const converted = Math.random() < 0.12;
        leadsData.push([campaign.id, creatorId, niche, dealValue, converted]);
      }
    }

    for (const lead of leadsData) {
      await pool.execute(
        'INSERT INTO leads (campaign_id, creator_id, niche, deal_value, converted) VALUES (?, ?, ?, ?, ?)',
        lead
      );
    }

    // Notifications
    const notifs = [
      ['New Campaign Request', 'Nykaa wants to collaborate with you on "Summer Skincare Routine"'],
      ['Campaign Update', 'Your content for Zomato "Binge Season" has been reviewed'],
      ['Payment Released', '₹18,000 has been released for "Pink Friday Sale"'],
      ['Deadline Reminder', 'boAt "Rockerz Launch" deadline is in 5 days'],
      ['New Campaign Request', 'Swiggy wants to collaborate on "Instamart Convenience"'],
      ['New Campaign Request', 'Mamaearth wants you for "Natural Beauty Campaign"']
    ];

    for (const [title, message] of notifs) {
      await pool.execute(
        'INSERT INTO notifications (creator_id, title, message) VALUES (?, ?, ?)',
        [creatorId, title, message]
      );
    }

    console.log('✅ Database seeded successfully');
    console.log('📧 Demo login: priya@gmail.com / password123');
    console.log('📧 Admin login: admin@gradix.com / admin123');
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
  }
}

export default seedDatabase;
