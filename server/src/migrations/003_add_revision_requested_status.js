async function migrate(pool) {
  await pool.query(
    "ALTER TABLE campaigns MODIFY COLUMN status ENUM('request_sent','creator_accepted','agreement_locked','content_uploaded','brand_approved','posted_live','analytics_collected','escrow_released','campaign_closed','negotiating','declined','revision_requested') DEFAULT 'request_sent'"
  );
  console.log('Migration 003: revision_requested added to campaigns.status ENUM');
}

module.exports = migrate;
