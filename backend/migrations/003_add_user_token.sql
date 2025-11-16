-- Migration: add token column to users table

ALTER TABLE users
  ADD COLUMN token VARCHAR(128) NULL,
  ADD UNIQUE KEY uk_users_token (token);
