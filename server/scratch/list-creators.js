require('dotenv').config();
const pool = require('../src/config/db');

async function listCreators() {
  try {
    const [rows] = await pool.query('SELECT email FROM creators LIMIT 5');
    console.log(JSON.stringify(rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listCreators();
