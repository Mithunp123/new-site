const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const pool = await mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    const creator_id = 1; // dummy
    const campaign_name = 'Test';
    const campaign_goal = 'Sales';
    const campaign_brief = 'Brief';
    const platform = 'instagram';
    const content_type = 'Reel';
    const number_of_posts = '1';
    const start_date = '2026-05-01';
    const end_date = '2026-05-30';
    const respond_by = '2026-05-15';
    const budget_offer = 1000;
    const platform_fee = 80;
    const total_to_escrow = 1080;
    const tracking_link = '';
    const deliverables_required = 'None';
    
    // Find a valid brand ID first
    const [brands] = await pool.query('SELECT id FROM brands LIMIT 1');
    if (brands.length === 0) {
        console.error('No brands found in DB');
        process.exit(1);
    }
    const brand_id = brands[0].id;
    
    // Find a valid creator ID first
    const [creators] = await pool.query('SELECT id FROM creators LIMIT 1');
    if (creators.length === 0) {
        console.error('No creators found in DB');
        process.exit(1);
    }
    const real_creator_id = creators[0].id;

    console.log('Testing INSERT...');
    const [res_camp] = await pool.query(
      `INSERT INTO campaigns (brand_id, creator_id, title, campaign_goal, brief, platform, content_type, number_of_posts, start_date, deadline, respond_by, budget, escrow_amount, platform_fee, total_to_escrow, tracking_link, tracking_link_provided, deliverables_required, status, escrow_status, commission_rate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [brand_id, real_creator_id, campaign_name, campaign_goal, campaign_brief, platform, content_type, number_of_posts, start_date, end_date, respond_by, budget_offer, total_to_escrow, platform_fee, total_to_escrow, tracking_link, tracking_link ? true : false, deliverables_required, 'request_sent', 'pending', 10.00]
    );
    
    console.log('Insert success. ID:', res_camp.insertId);
    process.exit(0);
  } catch (err) {
    console.error('Error during test:', err);
    process.exit(1);
  }
})();
