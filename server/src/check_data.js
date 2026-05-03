require('dotenv').config();
const pool = require('./config/db');
async function run() {
  try {
    const [rows] = await pool.query('SELECT id, name, upi_id FROM creators');
    console.log(JSON.stringify(rows, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
run();
