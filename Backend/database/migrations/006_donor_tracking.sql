-- Migration 006: Donor live location tracking
-- Used for real-time donor tracking via Socket.IO

CREATE TABLE IF NOT EXISTS donor_locations (
    id            SERIAL PRIMARY KEY,
    donor_id      INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    request_id    INTEGER REFERENCES blood_requests(id) ON DELETE CASCADE,
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_donor_locations_donor_request
    ON donor_locations(donor_id, request_id);
