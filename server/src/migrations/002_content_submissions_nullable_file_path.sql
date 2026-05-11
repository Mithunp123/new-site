-- Migration 002: Make file_path nullable in content_submissions
-- URL-based content submissions do not have a file_path only file uploads do.
ALTER TABLE content_submissions
  MODIFY COLUMN file_path VARCHAR(500) NULL DEFAULT NULL;
