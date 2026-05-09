async function columnExists(pool, tableName, columnName) {
  const [rows] = await pool.query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND COLUMN_NAME = ?
      LIMIT 1
    `,
    [tableName, columnName]
  );
  return rows.length > 0;
}

async function indexExists(pool, tableName, indexName) {
  const [rows] = await pool.query(
    `
      SELECT INDEX_NAME
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
        AND INDEX_NAME = ?
      LIMIT 1
    `,
    [tableName, indexName]
  );
  return rows.length > 0;
}

async function addColumnIfMissing(pool, tableName, columnName, definition) {
  if (await columnExists(pool, tableName, columnName)) return;
  await pool.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

async function migrate(pool) {
  if (!(await indexExists(pool, 'creator_social_profiles', 'unique_creator_platform'))) {
    await pool.query(
      'ALTER TABLE creator_social_profiles ADD UNIQUE KEY unique_creator_platform (creator_id, platform)'
    );
  }

  await addColumnIfMissing(pool, 'creator_social_profiles', 'is_verified', 'BOOLEAN DEFAULT false');
  await addColumnIfMissing(pool, 'creator_social_profiles', 'instagram_connected', 'BOOLEAN DEFAULT false');
  await addColumnIfMissing(pool, 'creator_social_profiles', 'instagram_access_token', 'TEXT NULL');
  await addColumnIfMissing(pool, 'creator_social_profiles', 'facebook_page_id', 'VARCHAR(64) NULL');
  await addColumnIfMissing(pool, 'creator_social_profiles', 'instagram_business_id', 'VARCHAR(64) NULL');
  await addColumnIfMissing(pool, 'creator_social_profiles', 'instagram_username', 'VARCHAR(150) NULL');
  await addColumnIfMissing(pool, 'creator_social_profiles', 'instagram_follows', 'INT DEFAULT 0');
  await addColumnIfMissing(pool, 'creator_social_profiles', 'instagram_media_count', 'INT DEFAULT 0');
  await addColumnIfMissing(pool, 'creator_social_profiles', 'instagram_profile_picture', 'VARCHAR(500) NULL');
  await addColumnIfMissing(pool, 'creator_social_profiles', 'instagram_connected_at', 'TIMESTAMP NULL');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS creator_instagram_media (
      id INT AUTO_INCREMENT PRIMARY KEY,
      creator_id INT NOT NULL,
      instagram_media_id VARCHAR(64) NOT NULL,
      caption TEXT,
      media_type VARCHAR(50),
      media_url VARCHAR(1000),
      permalink VARCHAR(1000),
      posted_at TIMESTAMP NULL,
      views INT DEFAULT 0,
      reach INT DEFAULT 0,
      likes INT DEFAULT 0,
      comments INT DEFAULT 0,
      shares INT DEFAULT 0,
      saves INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_creator_instagram_media (creator_id, instagram_media_id),
      FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
    )
  `);
}

module.exports = migrate;
