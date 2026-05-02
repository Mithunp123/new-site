require('dotenv').config();
const pool = require('./src/config/db');
const { hashPassword } = require('./src/helpers/bcrypt');

async function resetAdmin() {
  try {
    const hashed = await hashPassword('admin123');
    await pool.query('UPDATE admins SET password_hash = ? WHERE email = ?', [hashed, 'admin@gradix.com']);
    console.log('Admin password reset to admin123');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting admin:', err);
    process.exit(1);
  }
}

resetAdmin();
