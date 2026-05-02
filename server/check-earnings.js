require('dotenv').config();
const pool = require('./src/config/db');

async function checkEarnings() {
  try {
    const [rows] = await pool.query('DESCRIBE earnings');
    console.log('Earnings Table Structure:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking earnings table:', err);
    process.exit(1);
  }
}

checkEarnings();
