-- Migration 005: Location system (Google Maps based location selection)
-- Adds latitude / longitude / formatted_address to users (donors) and
-- hospitals (+ pending_hospitals, so approval can carry the location
-- through), and adds hospital/pickup coordinate columns to blood_requests.
-- All columns are nullable and additive — existing rows/functionality
-- are unaffected.

-- 1. Users (covers donor accounts, and hospital accounts once approved)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS latitude          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- 2. Hospitals
ALTER TABLE hospitals
  ADD COLUMN IF NOT EXISTS latitude          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- 3. Pending hospitals — location is captured at signup time, before the
--    hospital row exists, so it needs to be carried here first and copied
--    over on admin approval.
ALTER TABLE pending_hospitals
  ADD COLUMN IF NOT EXISTS latitude          DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude         DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS formatted_address TEXT;

-- 4. Blood requests — hospital location snapshot + optional pickup point
ALTER TABLE blood_requests
  ADD COLUMN IF NOT EXISTS hospital_latitude  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS hospital_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pickup_latitude    DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS pickup_longitude   DOUBLE PRECISION;

-- 5. Basic sanity constraints on coordinate ranges (only enforced when set)
DO $$
BEGIN
    ALTER TABLE users
        ADD CONSTRAINT users_lat_range CHECK (latitude  IS NULL OR (latitude  BETWEEN -90  AND 90));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE users
        ADD CONSTRAINT users_lng_range CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE hospitals
        ADD CONSTRAINT hospitals_lat_range CHECK (latitude  IS NULL OR (latitude  BETWEEN -90  AND 90));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE hospitals
        ADD CONSTRAINT hospitals_lng_range CHECK (longitude IS NULL OR (longitude BETWEEN -180 AND 180));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
