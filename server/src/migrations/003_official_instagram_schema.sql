-- Migration: Official Instagram Schema
-- Description: Creates tables for official Instagram Graph API connection and Reels storage

CREATE TABLE IF NOT EXISTS creator_social_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  instagram_connected BOOLEAN DEFAULT false,
  instagram_access_token TEXT,
  facebook_page_id VARCHAR(100),
  instagram_business_id VARCHAR(100),
  instagram_username VARCHAR(100),
  instagram_followers INT DEFAULT 0,
  instagram_follows INT DEFAULT 0,
  instagram_media_count INT DEFAULT 0,
  instagram_profile_picture TEXT,
  connected_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (creator_id)
);

CREATE TABLE IF NOT EXISTS instagram_reels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  media_id VARCHAR(100) NOT NULL UNIQUE,
  caption TEXT,
  media_type VARCHAR(50),
  media_url TEXT,
  permalink TEXT,
  thumbnail_url TEXT,
  views INT DEFAULT 0,
  reach INT DEFAULT 0,
  likes INT DEFAULT 0,
  comments INT DEFAULT 0,
  shares INT DEFAULT 0,
  saved INT DEFAULT 0,
  posted_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE
);
