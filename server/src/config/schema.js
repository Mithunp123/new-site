import pool from './db.js';

const schema = `
CREATE TABLE IF NOT EXISTS creators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  bio TEXT,
  location VARCHAR(100),
  languages_known JSON,
  profile_photo VARCHAR(255),
  role ENUM('creator','admin') DEFAULT 'creator',
  is_verified BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creator_social_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  platform ENUM('instagram','youtube','twitter','tiktok','linkedin') NOT NULL,
  profile_url VARCHAR(255),
  followers_count INT DEFAULT 0,
  avg_views INT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  audience_location VARCHAR(100),
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creator_niche_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  categories JSON,
  subcategories JSON,
  worked_with_brands JSON,
  performance_metrics JSON,
  screenshots_testimonials JSON,
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS creator_portfolio (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  sample_links JSON,
  collaboration_preference ENUM('paid','barter','both') DEFAULT 'paid',
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS brands (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  logo_url VARCHAR(255),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  brand_id INT NOT NULL,
  creator_id INT NOT NULL,
  title VARCHAR(200),
  deliverable VARCHAR(255),
  brief TEXT,
  tracking_link VARCHAR(255),
  deadline DATE,
  status ENUM(
    'request_sent','creator_accepted','agreement_locked',
    'content_uploaded','brand_approved','posted_live',
    'analytics_collected','escrow_released','campaign_closed'
  ) DEFAULT 'request_sent',
  escrow_amount DECIMAL(10,2) DEFAULT 0,
  escrow_status ENUM('pending','held','released') DEFAULT 'pending',
  content_url VARCHAR(255),
  respond_by DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (creator_id) REFERENCES creators(id)
);

CREATE TABLE IF NOT EXISTS campaign_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  views INT DEFAULT 0,
  reach INT DEFAULT 0,
  clicks INT DEFAULT 0,
  conversions INT DEFAULT 0,
  sales_generated DECIMAL(10,2) DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  cost_per_conversion DECIMAL(10,2) DEFAULT 0,
  platform VARCHAR(50),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  creator_id INT NOT NULL,
  niche VARCHAR(100),
  deal_value DECIMAL(10,2) DEFAULT 0,
  converted BOOLEAN DEFAULT false,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (creator_id) REFERENCES creators(id)
);

CREATE TABLE IF NOT EXISTS earnings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  campaign_id INT NOT NULL,
  amount DECIMAL(10,2) DEFAULT 0,
  payment_status ENUM('in_escrow','pending','released') DEFAULT 'pending',
  payout_method VARCHAR(100),
  released_at TIMESTAMP NULL,
  withdrawn_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  title VARCHAR(255),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id)
);

CREATE TABLE IF NOT EXISTS negotiations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  creator_id INT NOT NULL,
  proposed_amount DECIMAL(10,2),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (creator_id) REFERENCES creators(id)
);
`;

export async function initializeDatabase() {
  try {
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await pool.execute(statement);
    }
    console.log('✅ Database schema initialized successfully');
  } catch (error) {
    console.error('❌ Schema initialization failed:', error.message);
    throw error;
  }
}

export default initializeDatabase;
