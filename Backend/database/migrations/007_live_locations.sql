CREATE TABLE IF NOT EXISTS live_locations (
    id            SERIAL PRIMARY KEY,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id    INTEGER NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    speed         DOUBLE PRECISION,
    heading       DOUBLE PRECISION,
    accuracy      DOUBLE PRECISION,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, request_id)
);

CREATE INDEX IF NOT EXISTS idx_live_locations_request
    ON live_locations(request_id);

ALTER TABLE blood_requests DROP CONSTRAINT IF EXISTS blood_requests_status_check;
ALTER TABLE blood_requests ADD CONSTRAINT blood_requests_status_check
    CHECK(status IN ('pending','accepted','arrived','completed','cancelled'));
