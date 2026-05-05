require('dotenv').config();
const pool = require('./src/config/db');

async function debugData() {
  try {
    const [campaigns] = await pool.query('SELECT * FROM campaigns');
    const [brands] = await pool.query('SELECT * FROM brands');
    const [creators] = await pool.query('SELECT * FROM creators');
    const [social] = await pool.query('SELECT * FROM creator_social_profiles');

    console.log('--- CAMPAIGNS ---');
    console.table(campaigns);
    console.log('--- BRANDS ---');
    console.table(brands);
    console.log('--- CREATORS ---');
    console.table(creators);
    console.log('--- SOCIAL PROFILES ---');
    console.table(social);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debugData();
