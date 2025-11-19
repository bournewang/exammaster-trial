-- Add token expiration timestamp to users table
ALTER TABLE users ADD COLUMN token_expires_at DATETIME NULL DEFAULT NULL;

-- Create index for faster token lookups
CREATE INDEX idx_token_expires_at ON users(token_expires_at);
