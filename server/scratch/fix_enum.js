const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });

    console.log('Updating ENUM...');
    await conn.query(`ALTER TABLE campaigns MODIFY COLUMN status ENUM(
      'request_sent',
      'creator_accepted',
      'agreement_locked',
      'content_uploaded',
      'brand_approved',
      'posted_live',
      'analytics_collected',
      'escrow_released',
      'campaign_closed',
      'declined'
    ) DEFAULT 'request_sent'`);
    
    console.log('ENUM updated successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
