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
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    )
  `);
  console.log('✓ messages table');

  // 3. Add created_at to campaign_analytics if missing
  try {
    await conn.query(`ALTER TABLE campaign_analytics ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
    console.log('✓ campaign_analytics.created_at added');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ campaign_analytics.created_at already exists');
    else throw e;
  }

  // 4. Add is_flagged to creators if missing
  try {
    await conn.query(`ALTER TABLE creators ADD COLUMN is_flagged BOOLEAN DEFAULT false`);
    console.log('✓ creators.is_flagged added');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ creators.is_flagged already exists');
    else throw e;
  }

  // 5. Add youtube_channel_id to creator_social_profiles if missing
  try {
    await conn.query(`ALTER TABLE creator_social_profiles ADD COLUMN channel_id VARCHAR(255) NULL`);
    console.log('✓ creator_social_profiles.channel_id added');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') console.log('✓ creator_social_profiles.channel_id already exists');
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

  await conn.end();
  console.log('\nAll migrations complete.');
}

migrate().catch(e => { console.error('Migration failed:', e.message); process.exit(1); });
