require('dotenv').config();
const pool = require('./src/config/db');

async function updateDb() {
  try {
    const conn = await pool.getConnection();

    const columnsToAdd = [
      { name: 'campaign_goal', definition: 'VARCHAR(100)' },
      { name: 'content_type', definition: 'VARCHAR(100)' },
      { name: 'number_of_posts', definition: 'VARCHAR(100)' },
      { name: 'start_date', definition: 'DATE' },
      { name: 'deliverables_required', definition: 'TEXT' },
      { name: 'platform_fee', definition: 'DECIMAL(10,2) DEFAULT 0' },
      { name: 'total_to_escrow', definition: 'DECIMAL(10,2) DEFAULT 0' },
      { name: 'targeting_type', definition: "ENUM('specific','category') DEFAULT 'specific'" },
      { name: 'target_niches', definition: 'JSON' },
      { name: 'target_platforms', definition: 'JSON' },
      { name: 'target_min_followers', definition: 'INT DEFAULT 0' },
      { name: 'target_max_followers', definition: 'INT DEFAULT 0' },
      { name: 'target_min_er', definition: 'DECIMAL(5,2) DEFAULT 0' },
      { name: 'target_location', definition: 'VARCHAR(100)' },
      { name: 'negotiate_amount', definition: 'DECIMAL(10,2) DEFAULT NULL' },
      { name: 'negotiate_message', definition: 'TEXT' },
      { name: 'brand_rejection_reason', definition: 'TEXT' },
      { name: 'content_type_required', definition: 'VARCHAR(100)' },
      { name: 'campaign_group_id', definition: 'INT NULL' }
    ];

    for (const col of columnsToAdd) {
      try {
        await conn.query(`ALTER TABLE campaigns ADD COLUMN ${col.name} ${col.definition};`);
        console.log(`Added column ${col.name}`);
      } catch (e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
          console.log(`Column ${col.name} already exists`);
        } else {
          throw e;
        }
      }
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS campaign_groups (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        brand_id        INT NOT NULL,
        group_title     VARCHAR(200) NOT NULL,
        campaign_goal   VARCHAR(100),
        brief           TEXT,
        platform        VARCHAR(50),
        content_type    VARCHAR(100),
        number_of_posts VARCHAR(100),
        start_date      DATE,
        end_date        DATE,
        respond_by      DATE,
        budget_per_creator DECIMAL(10,2) DEFAULT 0,
        platform_fee_rate  DECIMAL(5,2) DEFAULT 8.00,
        tracking_link   VARCHAR(255),
        deliverables_required TEXT,
        targeting_type  ENUM('specific','category') DEFAULT 'specific',
        target_niches   JSON,
        target_platforms JSON,
        target_min_followers INT DEFAULT 0,
        target_max_followers INT DEFAULT 0,
        target_min_er   DECIMAL(5,2) DEFAULT 0,
        target_location VARCHAR(100),
        total_creators_targeted INT DEFAULT 0,
        total_creators_accepted INT DEFAULT 0,
        status          ENUM('draft','active','completed','cancelled') DEFAULT 'active',
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
      );
    `);

    try {
      await conn.query(`
        ALTER TABLE campaigns
          ADD FOREIGN KEY (campaign_group_id) REFERENCES campaign_groups(id) ON DELETE SET NULL;
      `);
      console.log('Added foreign key for campaign_group_id');
    } catch (e) {
      // FK might already exist, ignoring for simplicity
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS content_submissions (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id     INT NOT NULL,
        creator_id      INT NOT NULL,
        file_path       VARCHAR(500) NOT NULL,
        file_name       VARCHAR(255),
        file_size       BIGINT DEFAULT 0,
        file_type       VARCHAR(50),
        duration_seconds INT DEFAULT 0,
        caption         TEXT,
        submission_note TEXT,
        version         INT DEFAULT 1,
        status          ENUM('submitted','approved','rejected','revision_requested') DEFAULT 'submitted',
        rejection_note  TEXT,
        submitted_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at     TIMESTAMP NULL,
        FOREIGN KEY (campaign_id)  REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id)   REFERENCES creators(id)  ON DELETE CASCADE
      );
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS campaign_negotiations (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        campaign_id     INT NOT NULL,
        creator_id      INT NOT NULL,
        proposed_amount DECIMAL(10,2) NOT NULL,
        message         TEXT,
        status          ENUM('pending','accepted','rejected') DEFAULT 'pending',
        brand_response  TEXT,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        responded_at    TIMESTAMP NULL,
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
        FOREIGN KEY (creator_id)  REFERENCES creators(id)  ON DELETE CASCADE
      );
    `);

    console.log("Database updated successfully");
    conn.release();
    process.exit(0);
  } catch (err) {
    console.error("Error updating DB:", err);
    process.exit(1);
  }
}

updateDb();
