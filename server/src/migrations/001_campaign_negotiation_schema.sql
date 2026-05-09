-- Migration 001: Campaign Negotiation Schema
-- Task 1.1: Alter campaigns table

ALTER TABLE campaigns
  MODIFY COLUMN status ENUM(
    'request_sent',
    'creator_accepted',
    'agreement_locked',
    'content_uploaded',
    'brand_approved',
    'posted_live',
    'analytics_collected',
    'escrow_released',
    'campaign_closed',
    'negotiating',
    'declined'
  ) DEFAULT 'request_sent';

ALTER TABLE campaigns
  ADD COLUMN negotiate_amount DECIMAL(10,2) NULL DEFAULT NULL,
  ADD COLUMN negotiate_message TEXT NULL DEFAULT NULL;

-- Task 1.2: Create campaign_negotiations table

CREATE TABLE IF NOT EXISTS campaign_negotiations (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id  INT NOT NULL,
  proposed_by  ENUM('brand', 'creator') NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  message      TEXT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_neg_campaign (campaign_id)
);

-- Task 1.3: Alter content_submissions table

ALTER TABLE content_submissions
  ADD COLUMN platform    VARCHAR(50)  NULL DEFAULT NULL,
  ADD COLUMN content_url VARCHAR(500) NULL DEFAULT NULL;
