-- Migration 002: Full donation lifecycle support

-- 1. Extend donors table with eligibility tracking
ALTER TABLE donors
  ADD COLUMN IF NOT EXISTS eligible_for_donation BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS next_eligible_date     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_donated_at        TIMESTAMP;

-- 2. Extend request_responses with full lifecycle statuses + rejection info
ALTER TABLE request_responses
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS donated_at       TIMESTAMP;

-- Change status constraint to support new values
ALTER TABLE request_responses
  DROP CONSTRAINT IF EXISTS request_responses_status_check;

ALTER TABLE request_responses
  ADD CONSTRAINT request_responses_status_check
  CHECK (status IN ('pending','accepted','rejected','donated'));

-- 3. Extend donations table with request linkage and status
ALTER TABLE donations
  ADD COLUMN IF NOT EXISTS request_id INTEGER REFERENCES blood_requests(id),
  ADD COLUMN IF NOT EXISTS status     VARCHAR(20) DEFAULT 'completed'
    CHECK (status IN ('completed'));

-- 4. Extend blood_requests to track units received
ALTER TABLE blood_requests
  ADD COLUMN IF NOT EXISTS units_received INTEGER DEFAULT 0,
  DROP CONSTRAINT IF EXISTS blood_requests_status_check;

ALTER TABLE blood_requests
  ADD CONSTRAINT blood_requests_status_check
  CHECK (status IN ('pending','accepted','completed','partially_completed','cancelled'));
