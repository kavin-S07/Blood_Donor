-- ============================================================
-- Migration: 004_admin_module.sql
-- Adds all columns and tables needed for the Admin module.
-- Safe to run on an existing database (uses IF NOT EXISTS / DO blocks).
-- ============================================================

-- 1. Allow 'admin' role in users.role CHECK
--    PostgreSQL does not support ALTER CHECK directly;
--    we drop the old constraint and add the updated one.
DO $$
BEGIN
    -- Drop existing role check if it exists (name may vary by DB)
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

    -- Add updated constraint that includes 'admin'
    ALTER TABLE users
        ADD CONSTRAINT users_role_check
        CHECK (role IN ('donor', 'hospital', 'admin'));
END $$;

-- 2. Add is_active column to users if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 3. Add updated_at column to users if missing
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 4. Add updated_at column to hospitals if missing
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 5. Add verified column to hospitals if missing
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- 6. Create pending_hospitals table if missing
CREATE SEQUENCE IF NOT EXISTS pending_hosp_seq START 80000;

CREATE TABLE IF NOT EXISTS pending_hospitals (
    id               INTEGER PRIMARY KEY DEFAULT nextval('pending_hosp_seq'),
    hospital_name    VARCHAR(200) NOT NULL,
    email            VARCHAR(150) UNIQUE NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    license_number   VARCHAR(100) NOT NULL,
    address          TEXT         NOT NULL,
    phone            VARCHAR(20)  NOT NULL,
    status           VARCHAR(20)  DEFAULT 'pending'
                     CHECK(status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- 7. Add created_at to donations if missing
ALTER TABLE donations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
