-- Migration 009: Fix donations.request_id FK to allow blood_request deletion
--
-- Migration 002 added `donations.request_id INTEGER REFERENCES blood_requests(id)`
-- with no ON DELETE behaviour, which defaults to NO ACTION/RESTRICT.
-- As soon as a blood request had at least one linked donation record
-- (i.e. any donor had been marked as "donated" for it), deleting that
-- request from the Hospital Dashboard would fail with a Postgres foreign
-- key violation (23503) and the frontend silently swallowed the error,
-- making the "Delete" button appear completely broken.
--
-- Fix: change the FK to ON DELETE SET NULL so historical donation
-- records are preserved (donation history stays intact) while the
-- parent blood_request row can still be deleted.

ALTER TABLE donations
  DROP CONSTRAINT IF EXISTS donations_request_id_fkey;

ALTER TABLE donations
  ADD CONSTRAINT donations_request_id_fkey
  FOREIGN KEY (request_id) REFERENCES blood_requests(id) ON DELETE SET NULL;
