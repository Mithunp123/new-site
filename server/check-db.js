require('dotenv').config();
const pool = require('./src/config/db');

async function checkAdmin() {
  try {
    const [rows] = await pool.query('SELECT * FROM admins');
    console.log('Admins in DB:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Error checking admins:', err);
    process.exit(1);
  }
}

checkAdmin();
