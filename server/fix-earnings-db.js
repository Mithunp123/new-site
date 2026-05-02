require('dotenv').config();
const pool = require('./src/config/db');

async function fixEarnings() {
  try {
    console.log('Fixing earnings table columns...');
    // Add missing columns if they don't exist
    await pool.query('ALTER TABLE earnings ADD COLUMN IF NOT EXISTS gross_amount DECIMAL(10,2) DEFAULT 0 AFTER campaign_id');
    await pool.query('ALTER TABLE earnings ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10.00 AFTER gross_amount');
    await pool.query('ALTER TABLE earnings ADD COLUMN IF NOT EXISTS commission_amt DECIMAL(10,2) DEFAULT 0 AFTER commission_rate');
    await pool.query('ALTER TABLE earnings ADD COLUMN IF NOT EXISTS net_amount DECIMAL(10,2) DEFAULT 0 AFTER commission_amt');
    
    // Copy data from 'amount' to 'net_amount' if 'amount' exists
    await pool.query('UPDATE earnings SET net_amount = amount, gross_amount = amount WHERE net_amount = 0 AND amount > 0');
    
    console.log('Earnings table fixed.');
    process.exit(0);
  } catch (err) {
    console.error('Error fixing earnings table:', err);
    process.exit(1);
  }
}

fixEarnings();
