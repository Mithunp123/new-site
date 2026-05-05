require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });

  const brandHash = await bcrypt.hash('brand123', 10);
  const creatorHash = await bcrypt.hash('creator123', 10);

  await conn.query('UPDATE brands SET password_hash=? WHERE id=1', [brandHash]);
  await conn.query('UPDATE creators SET password_hash=? WHERE id=5', [creatorHash]);

  console.log('Brand (phoenixmithun9@gmail.com) password reset to: brand123');
  console.log('Creator (phoenixmithun76@gmail.com) password reset to: creator123');
  await conn.end();
}
run().catch(e => console.error(e.message));
