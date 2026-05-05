require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });

  const alterations = [
    // brands table missing columns
    ['brands', 'description', 'ALTER TABLE brands ADD COLUMN description TEXT NULL'],
    ['brands', 'company_size', 'ALTER TABLE brands ADD COLUMN company_size VARCHAR(50) NULL'],
    ['brands', 'country', 'ALTER TABLE brands ADD COLUMN country VARCHAR(100) NULL'],
    ['brands', 'updated_at', 'ALTER TABLE brands ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    // campaigns missing columns
    ['campaigns', 'brand_rejection_reason', 'ALTER TABLE campaigns ADD COLUMN brand_rejection_reason TEXT NULL'],
    // creator_social_profiles missing unique key check
    ['creator_social_profiles', 'unique_platform', 'ALTER TABLE creator_social_profiles ADD UNIQUE KEY unique_creator_platform (creator_id, platform)'],
  ];

  for (const [table, col, sql] of alterations) {
    try {
      await conn.query(sql);
      console.log(`OK: ${table}.${col} added`);
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME' || e.message.includes('Duplicate')) {
        console.log(`SKIP: ${table}.${col} already exists`);
      } else {
        console.log(`WARN: ${table}.${col} - ${e.message}`);
      }
    }
  }

  await conn.end();
  console.log('Schema fixes complete');
}
run().catch(e => console.error(e.message));
