/**
 * migrate-sessions.js
 * Run once: node migrate-sessions.js
 * Creates the revoked_tokens table for session-based logout.
 */
require('dotenv').config();
const pool = require('./src/config/db');

async function migrate() {
  try {
    // Create revoked_tokens table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS revoked_tokens (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        token      TEXT NOT NULL,
        revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_revoked_at (revoked_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    console.log('✓ revoked_tokens table created (or already exists)');

    // Auto-cleanup job: remove tokens older than 8 days (past JWT_EXPIRES_IN of 7d)
    await pool.query(`
      CREATE EVENT IF NOT EXISTS cleanup_revoked_tokens
      ON SCHEDULE EVERY 1 DAY
      DO DELETE FROM revoked_tokens WHERE revoked_at < DATE_SUB(NOW(), INTERVAL 8 DAY);
    `);
    console.log('✓ cleanup event scheduled');

    console.log('\nMigration complete. Session-based logout is ready.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
}

migrate();
