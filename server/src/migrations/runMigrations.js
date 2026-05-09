const fs = require('fs/promises');
const path = require('path');
const pool = require('../config/db');

async function ensureMigrationTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function hasRun(filename) {
  const [rows] = await pool.query(
    'SELECT id FROM schema_migrations WHERE filename = ? LIMIT 1',
    [filename]
  );
  return rows.length > 0;
}

async function markRun(filename) {
  await pool.query(
    'INSERT IGNORE INTO schema_migrations (filename) VALUES (?)',
    [filename]
  );
}

async function runSqlMigration(filePath) {
  const sql = await fs.readFile(filePath, 'utf8');
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map(statement => statement.trim())
    .filter(statement => statement && !statement.startsWith('--'));

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      if (isIgnorableSqlMigrationError(err)) {
        console.warn(`[Migrations] Skipping already-applied statement: ${err.message}`);
        continue;
      }
      throw err;
    }
  }
}

function isIgnorableSqlMigrationError(err) {
  return [
    'ER_DUP_FIELDNAME',
    'ER_DUP_KEYNAME',
    'ER_TABLE_EXISTS_ERROR',
  ].includes(err.code);
}

async function runJsMigration(filePath) {
  const migrate = require(filePath);
  if (typeof migrate !== 'function') {
    throw new Error(`${path.basename(filePath)} does not export a migration function`);
  }
  await migrate(pool);
}

async function runMigrations() {
  await ensureMigrationTable();

  const migrationsDir = __dirname;
  const files = (await fs.readdir(migrationsDir))
    .filter(file => /^\d+_.+\.(sql|js)$/.test(file))
    .sort();

  for (const file of files) {
    if (await hasRun(file)) continue;

    const filePath = path.join(migrationsDir, file);
    console.log(`[Migrations] Running ${file}`);

    if (file.endsWith('.sql')) {
      await runSqlMigration(filePath);
    } else {
      await runJsMigration(filePath);
    }

    await markRun(file);
    console.log(`[Migrations] Completed ${file}`);
  }
}

module.exports = runMigrations;
