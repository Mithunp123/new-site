-- ─────────────────────────────────────────────────────
CREATE DATABASE IF NOT EXISTS gradix;
USE gradix;

-- CREATORS TABLE
CREATE TABLE IF NOT EXISTS creators (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(150) NOT NULL,
  email               VARCHAR(150) NOT NULL UNIQUE,
  phone               VARCHAR(20),
  password_hash       VARCHAR(255) NOT NULL,
  display_name        VARCHAR(100),
  bio                 TEXT,
  location            VARCHAR(100),
  languages_known     JSON,
  profile_photo       VARCHAR(255),
  role                ENUM('creator','admin') DEFAULT 'creator',
  is_verified         BOOLEAN DEFAULT false,
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- CREATOR SOCIAL PROFILES
CREATE TABLE IF NOT EXISTS creator_social_profiles (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  creator_id          INT NOT NULL,
  platform            ENUM('instagram','youtube','twitter','tiktok','linkedin') NOT NULL,
  profile_url         VARCHAR(255),
  followers_count     INT DEFAULT 0,
  avg_views           INT DEFAULT 0,
  engagement_rate     DECIMAL(5,2) DEFAULT 0.00,
  audience_location   VARCHAR(100),
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

-- CREATOR NICHE DETAILS
CREATE TABLE IF NOT EXISTS creator_niche_details (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  creator_id                INT NOT NULL UNIQUE,
  categories                JSON,
  subcategories             JSON,
  worked_with_brands        JSON,
  performance_metrics       TEXT,
  screenshots_testimonials  JSON,
  sample_links              JSON,
  collaboration_preference  ENUM('paid','barter','both') DEFAULT 'paid',
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

-- BRANDS TABLE
CREATE TABLE IF NOT EXISTS brands (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(150) NOT NULL,
  email               VARCHAR(150) NOT NULL UNIQUE,
  phone               VARCHAR(20),
  password_hash       VARCHAR(255) NOT NULL,
  website             VARCHAR(255),
  logo_url            VARCHAR(255),
  category            VARCHAR(100),
  description         TEXT,
  company_size        VARCHAR(50),
  country             VARCHAR(100),
  role                ENUM('brand') DEFAULT 'brand',
  is_active           BOOLEAN DEFAULT true,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- BRAND CAMPAIGN PREFERENCES
CREATE TABLE IF NOT EXISTS brand_preferences (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  brand_id                INT NOT NULL UNIQUE,
  content_types           JSON,
  target_age_group        VARCHAR(50),
  target_gender           VARCHAR(20),
  target_location         VARCHAR(100),
  budget_min              DECIMAL(10,2) DEFAULT 0,
  budget_max              DECIMAL(10,2) DEFAULT 0,
  preferred_niches        JSON,
  preferred_platforms     JSON,
  collaboration_type      ENUM('paid','barter','both') DEFAULT 'paid',
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- BRAND VERIFICATION
CREATE TABLE IF NOT EXISTS brand_verification (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  brand_id        INT NOT NULL UNIQUE,
  gst_number      VARCHAR(50),
  pan_number      VARCHAR(50),
  cin_number      VARCHAR(50),
  billing_address TEXT,
  is_verified     BOOLEAN DEFAULT false,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE
);

-- BRAND SAVED CREATORS
CREATE TABLE IF NOT EXISTS brand_saved_creators (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  brand_id    INT NOT NULL,
  creator_id  INT NOT NULL,
  saved_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_save (brand_id, creator_id),
  FOREIGN KEY (brand_id)   REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

-- ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin') DEFAULT 'admin',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS campaigns (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  brand_id                INT NOT NULL,
  creator_id              INT NOT NULL,
  title                   VARCHAR(200) NOT NULL,
  deliverable             VARCHAR(255),
  brief                   TEXT,
  platform                VARCHAR(50),
  budget                  DECIMAL(10,2) DEFAULT 0,
  escrow_amount           DECIMAL(10,2) DEFAULT 0,
  commission_rate         DECIMAL(5,2) DEFAULT 10.00,
  tracking_link           VARCHAR(255),
  tracking_link_provided  BOOLEAN DEFAULT false,
  deadline                DATE,
  respond_by              DATE,
  rejection_reason        TEXT,
  status                  ENUM(
    'request_sent',
    'creator_accepted',
    'agreement_locked',
    'content_uploaded',
    'brand_approved',
    'posted_live',
    'analytics_collected',
    'escrow_released',
    'campaign_closed',
    'declined'
  ) DEFAULT 'request_sent',
  escrow_status           ENUM('pending','held','released','refunded') DEFAULT 'pending',
  content_url             VARCHAR(255),
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id)   REFERENCES brands(id),
  FOREIGN KEY (creator_id) REFERENCES creators(id)
);

-- CAMPAIGN TIMELINE (audit trail of status changes)
CREATE TABLE IF NOT EXISTS campaign_timeline (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id   INT NOT NULL,
  status        VARCHAR(50) NOT NULL,
  changed_by    VARCHAR(20),
  note          TEXT,
  changed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- CAMPAIGN ANALYTICS
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id           INT NOT NULL UNIQUE,
  views                 INT DEFAULT 0,
  reach                 INT DEFAULT 0,
  clicks                INT DEFAULT 0,
  conversions           INT DEFAULT 0,
  sales_generated       DECIMAL(10,2) DEFAULT 0,
  engagement_rate       DECIMAL(5,2) DEFAULT 0,
  cost_per_conversion   DECIMAL(10,2) DEFAULT 0,
  platform              VARCHAR(50),
  recorded_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- EARNINGS
CREATE TABLE IF NOT EXISTS earnings (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  creator_id      INT NOT NULL,
  campaign_id     INT NOT NULL UNIQUE,
  gross_amount    DECIMAL(10,2) DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 10.00,
  commission_amt  DECIMAL(10,2) DEFAULT 0,
  net_amount      DECIMAL(10,2) DEFAULT 0,
  payment_status  ENUM('in_escrow','pending','released','withdrawn') DEFAULT 'pending',
  payout_method   VARCHAR(100),
  released_at     TIMESTAMP NULL,
  withdrawn_at    TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id)  REFERENCES creators(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- BRAND PAYMENTS
CREATE TABLE IF NOT EXISTS brand_payments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  brand_id        INT NOT NULL,
  campaign_id     INT NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  payment_type    ENUM('escrow','commission','refund') DEFAULT 'escrow',
  payment_status  ENUM('pending','processing','completed','failed') DEFAULT 'pending',
  transaction_id  VARCHAR(255),
  paid_at         TIMESTAMP NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id)    REFERENCES brands(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id   INT NOT NULL,
  creator_id    INT NOT NULL,
  brand_id      INT NOT NULL,
  niche         VARCHAR(100),
  deal_value    DECIMAL(10,2) DEFAULT 0,
  converted     BOOLEAN DEFAULT false,
  recorded_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (creator_id)  REFERENCES creators(id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id)
);

-- DISPUTES
CREATE TABLE IF NOT EXISTS disputes (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id     INT NOT NULL,
  raised_by_type  ENUM('brand','creator') NOT NULL,
  raised_by_id    INT NOT NULL,
  reason          TEXT NOT NULL,
  status          ENUM('open','under_review','resolved','closed') DEFAULT 'open',
  favour_of       ENUM('brand','creator') NULL,
  resolution      TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at     TIMESTAMP NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- COMMISSIONS
CREATE TABLE IF NOT EXISTS commissions (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id       INT NOT NULL UNIQUE,
  brand_id          INT NOT NULL,
  creator_id        INT NOT NULL,
  total_amount      DECIMAL(10,2),
  commission_rate   DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  creator_payout    DECIMAL(10,2),
  status            ENUM('pending','processed') DEFAULT 'pending',
  processed_at      TIMESTAMP NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id),
  FOREIGN KEY (creator_id)  REFERENCES creators(id)
);

-- ROI TRACKING
CREATE TABLE IF NOT EXISTS roi_tracking (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id           INT NOT NULL UNIQUE,
  brand_id              INT NOT NULL,
  total_spend           DECIMAL(10,2) DEFAULT 0,
  total_revenue         DECIMAL(10,2) DEFAULT 0,
  roi_percentage        DECIMAL(8,2) DEFAULT 0,
  leads_generated       INT DEFAULT 0,
  conversions           INT DEFAULT 0,
  cost_per_lead         DECIMAL(10,2) DEFAULT 0,
  cost_per_conversion   DECIMAL(10,2) DEFAULT 0,
  recorded_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (brand_id)    REFERENCES brands(id)
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_type   ENUM('creator','brand','admin') NOT NULL,
  user_id     INT NOT NULL,
  title       VARCHAR(255),
  message     TEXT,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CREATOR FLAGS (fake detection log)
CREATE TABLE IF NOT EXISTS creator_flags (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  creator_id  INT NOT NULL,
  flagged_by  INT NOT NULL,
  reason      TEXT,
  action      ENUM('flagged','cleared') DEFAULT 'flagged',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id),
  FOREIGN KEY (flagged_by) REFERENCES admins(id)
);

-- MESSAGES (WebSocket chat between brand and creator per campaign)
CREATE TABLE IF NOT EXISTS messages (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id  INT NOT NULL,
  sender_type  ENUM('brand','creator') NOT NULL,
  sender_id    INT NOT NULL,
  message      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  INDEX idx_messages_campaign (campaign_id),
  INDEX idx_messages_unread (campaign_id, sender_type, is_read)
);

-- CONTENT SUBMISSIONS (tracks each content upload attempt per campaign)
CREATE TABLE IF NOT EXISTS content_submissions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id   INT NOT NULL,
  creator_id    INT NOT NULL,
  file_path     VARCHAR(500),
  status        ENUM('submitted','approved','revision_requested') DEFAULT 'submitted',
  rejection_note TEXT,
  submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at   TIMESTAMP NULL,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (creator_id)  REFERENCES creators(id)
);

-- WITHDRAWALS (creator payout requests)
CREATE TABLE IF NOT EXISTS withdrawals (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  creator_id    INT NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  payout_method VARCHAR(50) DEFAULT 'upi',
  upi_id        VARCHAR(100),
  status        ENUM('pending','processing','completed','failed') DEFAULT 'pending',
  requested_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  processed_at  TIMESTAMP NULL,
  FOREIGN KEY (creator_id) REFERENCES creators(id)
);

-- CAMPAIGN GROUPS (for bulk campaign creation targeting multiple creators)
CREATE TABLE IF NOT EXISTS campaign_groups (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  brand_id                 INT NOT NULL,
  group_title              VARCHAR(200) NOT NULL,
  campaign_goal            TEXT,
  brief                    TEXT,
  platform                 VARCHAR(50),
  content_type             VARCHAR(100),
  number_of_posts          INT DEFAULT 1,
  start_date               DATE,
  end_date                 DATE,
  respond_by               DATE,
  budget_per_creator       DECIMAL(10,2) DEFAULT 0,
  platform_fee_rate        DECIMAL(5,2) DEFAULT 8.00,
  tracking_link            VARCHAR(255),
  deliverables_required    TEXT,
  targeting_type           ENUM('specific','category') DEFAULT 'specific',
  target_niches            JSON,
  target_platforms         JSON,
  target_min_followers     INT DEFAULT 0,
  target_max_followers     INT DEFAULT 0,
  target_min_er            DECIMAL(5,2) DEFAULT 0,
  target_location          VARCHAR(100),
  total_creators_targeted  INT DEFAULT 0,
  total_creators_accepted  INT DEFAULT 0,
  status                   ENUM('active','completed','cancelled') DEFAULT 'active',
  created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- SEED DEFAULT ADMIN
INSERT IGNORE INTO admins (name, email, password_hash, role)
VALUES (
  'Super Admin',
  'admin@gradix.com',
  '$2b$10$iX2G6NZRME3DzzFJJgwbo.7O8FNG/J9mhmYv2spd2l3d50R14JPDi',
  'admin'
);
