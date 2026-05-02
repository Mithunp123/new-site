require('dotenv').config();
const pool = require('./src/config/db');

async function recreateEarnings() {
  try {
    console.log('Recreating earnings table...');
    await pool.query('DROP TABLE IF EXISTS earnings');
    await pool.query(`
      CREATE TABLE earnings (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        creator_id      INT NOT NULL,
        campaign_id     INT NOT NULL UNIQUE,
        gross_amount    DECIMAL(10,2) DEFAULT 0,
        commission_rate DECIMAL(5,2) DEFAULT 10.00,
        commission_amt  DECIMAL(10,2) DEFAULT 0,
        net_amount      DECIMAL(10,2) DEFAULT 0,
        payment_status  ENUM('in_escrow','pending','released','withdrawn') DEFAULT 'pending',
        payout_method   VARCHAR(100),
        released_at     TIMESTAMP NULL,
        withdrawn_at    TIMESTAMP NULL,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id)  REFERENCES creators(id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);
    console.log('Earnings table recreated successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error recreating earnings table:', err);
    process.exit(1);
  }
}

recreateEarnings();
