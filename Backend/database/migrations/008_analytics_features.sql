-- Migration 008: Analytics & notification features for enhanced hospital dashboard
-- Tracks response times, travel times, notification logs, and monthly donation stats

CREATE TABLE IF NOT EXISTS donation_tracking (
    id              SERIAL PRIMARY KEY,
    request_id      INTEGER NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    donor_id        INTEGER NOT NULL REFERENCES donors(id) ON DELETE CASCADE,
    response_id     INTEGER NOT NULL REFERENCES request_responses(id) ON DELETE CASCADE,
    accepted_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    travelling_at   TIMESTAMP,
    arrived_at      TIMESTAMP,
    completed_at    TIMESTAMP,
    response_time_min   DOUBLE PRECISION, -- minutes from creation to acceptance
    travel_time_min     DOUBLE PRECISION, -- minutes from acceptance to arrival
    donation_time_min   DOUBLE PRECISION  -- minutes from arrival to completion
);

CREATE INDEX IF NOT EXISTS idx_donation_tracking_request ON donation_tracking(request_id);
CREATE INDEX IF NOT EXISTS idx_donation_tracking_donor   ON donation_tracking(donor_id);

CREATE TABLE IF NOT EXISTS notification_logs (
    id            SERIAL PRIMARY KEY,
    request_id    INTEGER REFERENCES blood_requests(id) ON DELETE CASCADE,
    sender_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    recipient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type          VARCHAR(50) NOT NULL, -- 'new_request', 'donor_accepted', 'donor_travelling', 'donor_arrived', 'donation_completed', 'auto_notify'
    channel       VARCHAR(20) DEFAULT 'in_app',
    title         VARCHAR(255),
    message       TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_request ON notification_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_recipient ON notification_logs(recipient_id);

CREATE TABLE IF NOT EXISTS monthly_donation_stats (
    id            SERIAL PRIMARY KEY,
    hospital_id   INTEGER NOT NULL REFERENCES hospitals(id) ON DELETE CASCADE,
    year          INTEGER NOT NULL,
    month         INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    total_requests    INTEGER DEFAULT 0,
    completed_requests INTEGER DEFAULT 0,
    total_donations   INTEGER DEFAULT 0,
    total_units       INTEGER DEFAULT 0,
    UNIQUE(hospital_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_stats_hospital ON monthly_donation_stats(hospital_id);
