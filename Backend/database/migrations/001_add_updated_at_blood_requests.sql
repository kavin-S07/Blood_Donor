-- Migration: Add missing updated_at column to blood_requests
-- Run this against your existing database to fix the "column updated_at does not exist" error

ALTER TABLE blood_requests 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows
UPDATE blood_requests SET updated_at = created_at WHERE updated_at IS NULL;
