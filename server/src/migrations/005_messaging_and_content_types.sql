-- Migration 005: Direct Messaging + Multi Content Types + Confirmation Flow

-- 1. Conversations table — decoupled from campaigns for follow-based chat
CREATE TABLE IF NOT EXISTS conversations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  brand_id     INT NOT NULL,
  creator_id   INT NOT NULL,
  campaign_id  INT NULL,
  last_message_at TIMESTAMP NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_conv (brand_id, creator_id),
  FOREIGN KEY (brand_id)   REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE,
  INDEX idx_conv_brand (brand_id),
  INDEX idx_conv_creator (creator_id)
);

-- 2. Direct messages table — linked to conversations, not campaigns
CREATE TABLE IF NOT EXISTS direct_messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_type     ENUM('brand','creator') NOT NULL,
  sender_id       INT NOT NULL,
  message         TEXT NOT NULL,
  message_type    ENUM('text','image','file','system') DEFAULT 'text',
  file_url        VARCHAR(500) NULL,
  is_read         BOOLEAN DEFAULT false,
  is_delivered    BOOLEAN DEFAULT false,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  INDEX idx_dm_conv (conversation_id),
  INDEX idx_dm_unread (conversation_id, sender_type, is_read)
);

-- 3. Campaign deliverables table — allows multiple content types per campaign
CREATE TABLE IF NOT EXISTS campaign_deliverables (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id     INT NOT NULL,
  content_type    VARCHAR(100) NOT NULL,
  quantity        INT DEFAULT 1,
  platform        VARCHAR(50) NULL,
  notes           TEXT NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_deliverables_campaign (campaign_id)
);

-- 4. Add revision_requested to campaign status ENUM if not already present
ALTER TABLE campaigns
  MODIFY COLUMN status ENUM(
    'request_sent',
    'creator_accepted',
    'agreement_locked',
    'content_uploaded',
    'revision_requested',
    'brand_approved',
    'posted_live',
    'analytics_collected',
    'escrow_released',
    'campaign_closed',
    'negotiating',
    'declined'
  ) DEFAULT 'request_sent';

-- 5. Add brand_rejection_reason column for correction notes
ALTER TABLE campaigns
  ADD COLUMN brand_rejection_reason TEXT NULL;

-- 6. Add campaign_goal column
ALTER TABLE campaigns
  ADD COLUMN campaign_goal VARCHAR(200) NULL;

-- 7. Add multi-content columns to campaigns
ALTER TABLE campaigns
  ADD COLUMN content_types JSON NULL,
  ADD COLUMN number_of_posts INT DEFAULT 1,
  ADD COLUMN start_date DATE NULL,
  ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN total_to_escrow DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN deliverables_required TEXT NULL;
