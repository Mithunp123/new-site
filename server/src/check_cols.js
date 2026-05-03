require('dotenv').config();
const pool = require('./config/db');
async function run() {
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM creators');
    console.log(JSON.stringify(cols, null, 2));
  } catch (e) {
    console.error(e);
  }
  process.exit();
}
run();
