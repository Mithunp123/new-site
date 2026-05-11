const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function runMigrations() {
  const migrationsDir = __dirname;
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log('[Migrations] Starting migrations...');

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by ; but handle potential issues with multi-line statements if needed
    // For now, standard split is okay for these simple migrations
    const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);
    
    console.log(`[Migrations] Running ${file}...`);
    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (err) {
        // Skip errors for "already exists" to make it idempotent
        if (
          err.code === 'ER_DUP_FIELDNAME' || 
          err.code === 'ER_DUP_KEY' || 
          err.code === 'ER_TABLE_EXISTS_ERROR' ||
          err.code === 'ER_DUP_KEYNAME'
        ) {
          continue;
        } else {
          console.error(`[Migrations] Error in ${file} statement:`, err.message);
          console.error(`Statement: ${statement}`);
          throw err;
        }
      }
    }
  }
  console.log('[Migrations] All migrations completed successfully.');
}

module.exports = runMigrations;
