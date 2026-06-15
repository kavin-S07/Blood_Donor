-- Migration: Add missing updated_at column to donors
-- The donors table never had this column, but donor.repository.js
-- (updateAvailability, update, incrementDonations, markIneligible)
-- all set updated_at = NOW() on UPDATE — causing
-- "column updated_at of relation donors does not exist" on
-- the donate / mark-ineligible flow.

ALTER TABLE donors
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Backfill existing rows
UPDATE donors SET updated_at = created_at WHERE updated_at IS NULL;
