require('dotenv').config();
const pool = require('./src/config/db');

async function testQuery() {
  try {
    const creator_id = 5;
    const [rows] = await pool.query(`
      SELECT
        c.id AS campaign_id, b.name AS brand_name
      FROM campaigns c
      JOIN brands b ON b.id = c.brand_id
      WHERE c.creator_id = ?
    `, [creator_id]);
    console.log('Result length:', rows.length);
    console.log('Rows:', rows);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

testQuery();
