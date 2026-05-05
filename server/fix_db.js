const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  
  const columns = [
    "ADD COLUMN budget_min DECIMAL(10,2) DEFAULT 0",
    "ADD COLUMN budget_max DECIMAL(10,2) DEFAULT 0",
    "ADD COLUMN preferred_niches JSON",
    "ADD COLUMN preferred_platforms JSON",
    "ADD COLUMN target_location VARCHAR(100)",
    "ADD COLUMN collaboration_type ENUM('paid','barter','both') DEFAULT 'paid'"
  ];

  for (let col of columns) {
    try {
      await connection.query(`ALTER TABLE brand_preferences ${col};`);
      console.log("Success:", col);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("Already exists:", col);
      } else {
        console.error("Error on:", col, err.message);
      }
    }
  }

  const creatorNicheColumns = [
    "ADD COLUMN collaboration_preference ENUM('paid','barter','both') DEFAULT 'paid'",
    "ADD COLUMN sample_links JSON"
  ];

  for (let col of creatorNicheColumns) {
    try {
      await connection.query(`ALTER TABLE creator_niche_details ${col};`);
      console.log("Success creator_niche_details:", col);
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME') {
        console.log("Already exists creator_niche_details:", col);
      } else {
        console.error("Error on creator_niche_details:", col, err.message);
      }
    }
  }

  await connection.end();
}

run();
