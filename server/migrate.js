require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  console.log('Running migrations...');

  // 1. withdrawals table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS withdrawals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      creator_id INT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payout_method VARCHAR(50) DEFAULT 'upi',
      upi_id VARCHAR(100),
      status ENUM('pending','processing','completed','failed') DEFAULT 'pending',
      requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP NULL,
      FOREIGN KEY (creator_id) REFERENCES creators(id)
    )
  `);
  console.log('✓ withdrawals table');

  // 2. messages table (for WebSocket chat)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      campaign_id INT NOT NULL,
      sender_type ENUM('brand','creator') NOT NULL,
      sender_id INT NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      INDEX idx_messages_campaign (campaign_id),
      INDEX idx_messages_unread (campaign_id, sender_type, is_read)
    )
  `);
  console.log('✓ messages table');

  // 3. content_submissions table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS content_submissions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      campaign_id INT NOT NULL,
      creator_id INT NOT NULL,
      file_path VARCHAR(500),
      status ENUM('submitted','approved','revision_requested') DEFAULT 'submitted',
      rejection_note TEXT,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      reviewed_at TIMESTAMP NULL,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY (creator_id) REFERENCES creators(id)
    )
  `);
  console.log('✓ content_submissions table');

  // 4. campaign_groups table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS campaign_groups (
      id INT AUTO_INCREMENT PRIMARY KEY,
      brand_id INT NOT NULL,
      group_title VARCHAR(200) NOT NULL,
      campaign_goal TEXT,
      brief TEXT,
      platform VARCHAR(50),
      content_type VARCHAR(100),
      number_of_posts INT DEFAULT 1,
      start_date DATE,
      end_date DATE,
      respond_by DATE,
      budget_per_creator DECIMAL(10,2) DEFAULT 0,
      platform_fee_rate DECIMAL(5,2) DEFAULT 8.00,
      tracking_link VARCHAR(255),
      deliverables_required TEXT,
      targeting_type ENUM('specific','category') DEFAULT 'specific',
      target_niches JSON,
      target_platforms JSON,
      target_min_followers INT DEFAULT 0,
      target_max_followers INT DEFAULT 0,
      target_min_er DECIMAL(5,2) DEFAULT 0,
      target_location VARCHAR(100),
      total_creators_targeted INT DEFAULT 0,
      total_creators_accepted INT DEFAULT 0,
      status ENUM('active','completed','cancelled') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    )
  `);
  console.log('✓ campaign_groups table');

  // 5. Add created_at to campaign_analytics if missing
  try {
    await conn.query(`ALTER TABLE campaign_analytics ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    console.log('✓ campaign_analytics.created_at added');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ campaign_analytics.created_at already exists');
    else throw e;
  }

  // 6. Add updated_at to campaign_analytics
  try {
    await conn.query(`ALTER TABLE campaign_analytics ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`);
    console.log('✓ campaign_analytics.updated_at added');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ campaign_analytics.updated_at already exists');
    else throw e;
  }

  // 7. Add is_flagged to creators if missing
  try {
    await conn.query(`ALTER TABLE creators ADD COLUMN is_flagged BOOLEAN DEFAULT false`);
    console.log('✓ creators.is_flagged added');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ creators.is_flagged already exists');
    else throw e;
  }

  // 8. Add channel_id to creator_social_profiles if missing
  try {
    await conn.query(`ALTER TABLE creator_social_profiles ADD COLUMN channel_id VARCHAR(255) NULL`);
    console.log('✓ creator_social_profiles.channel_id added');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ creator_social_profiles.channel_id already exists');
    else throw e;
  }

  // 9. Add upi_id to creators if missing
  try {
    await conn.query(`ALTER TABLE creators ADD COLUMN upi_id VARCHAR(100) NULL`);
    console.log('✓ creators.upi_id added');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ creators.upi_id already exists');
    else throw e;
  }

  // 10. Add extra campaign columns if missing
  const campaignAlters = [
    ['campaign_goal', 'TEXT NULL'],
    ['content_type', 'VARCHAR(100) NULL'],
    ['number_of_posts', 'INT DEFAULT 1'],
    ['platform_fee', 'DECIMAL(10,2) DEFAULT 0'],
    ['total_to_escrow', 'DECIMAL(10,2) DEFAULT 0'],
    ['brand_rejection_reason', 'TEXT NULL'],
    ['negotiate_amount', 'DECIMAL(10,2) NULL'],
    ['negotiate_message', 'TEXT NULL'],
    ['campaign_group_id', 'INT NULL'],
    ['targeting_type', "VARCHAR(50) DEFAULT 'specific'"],
    ['target_niches', 'JSON NULL'],
    ['respond_by', 'DATE NULL'],
    ['start_date', 'DATE NULL'],
  ];
  for (const [col, def] of campaignAlters) {
    try {
      await conn.query(`ALTER TABLE campaigns ADD COLUMN ${col} ${def}`);
      console.log(`✓ campaigns.${col} added`);
    } catch(e) {
      if (e.code === 'ER_DUP_FIELDNAME') console.log(`✓ campaigns.${col} already exists`);
      else throw e;
    }
  }

  await conn.end();
  console.log('\nAll migrations complete. Run this script once on your database.');
}

migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
