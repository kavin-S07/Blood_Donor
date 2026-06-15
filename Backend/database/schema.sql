-- ============================================================
-- BloodConnect Database Schema  (Fixed)
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS user_seq         START 10000;
CREATE SEQUENCE IF NOT EXISTS donor_seq        START 20000;
CREATE SEQUENCE IF NOT EXISTS hospital_seq     START 30000;
CREATE SEQUENCE IF NOT EXISTS request_seq      START 40000;
CREATE SEQUENCE IF NOT EXISTS response_seq     START 50000;
CREATE SEQUENCE IF NOT EXISTS donation_seq     START 600000;
CREATE SEQUENCE IF NOT EXISTS notification_seq START 700000;
CREATE SEQUENCE IF NOT EXISTS pending_hosp_seq START 80000;

-- ── Users ────────────────────────────────────────────────────
-- FIX 1: Added 'admin' to role CHECK
-- FIX 2: Added is_active column (used everywhere in admin code)
-- FIX 3: Added updated_at column (used in user.repository update())
CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY DEFAULT nextval('user_seq'),
    name       VARCHAR(100)  NOT NULL,
    email      VARCHAR(150)  UNIQUE NOT NULL,
    password   VARCHAR(255)  NOT NULL,
    phone      VARCHAR(20)   NOT NULL,
    address    TEXT,
    city       VARCHAR(100),
    state      VARCHAR(100),
    role       VARCHAR(20)   NOT NULL
               CHECK(role IN ('donor','hospital','admin')),
    is_active  BOOLEAN       DEFAULT TRUE,
    created_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ── Donors ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donors (
    id                 INTEGER PRIMARY KEY DEFAULT nextval('donor_seq'),
    user_id            INTEGER UNIQUE NOT NULL,
    blood_group        VARCHAR(5)  NOT NULL,
    age                INTEGER     NOT NULL,
    gender             VARCHAR(20),
    availability       BOOLEAN     DEFAULT TRUE,
    last_donation_date DATE,
    total_donations    INTEGER     DEFAULT 0,
    created_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Hospitals ────────────────────────────────────────────────
-- FIX 4: Added verified column (used in admin approveHospital)
-- FIX 5: Added updated_at column (used in hospital.repository update())
CREATE TABLE IF NOT EXISTS hospitals (
    id               INTEGER PRIMARY KEY DEFAULT nextval('hospital_seq'),
    user_id          INTEGER UNIQUE NOT NULL,
    hospital_name    VARCHAR(200) NOT NULL,
    license_number   VARCHAR(100) UNIQUE NOT NULL,
    hospital_address TEXT         NOT NULL,
    contact_number   VARCHAR(20)  NOT NULL,
    verified         BOOLEAN      DEFAULT FALSE,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ── Pending Hospitals ─────────────────────────────────────────
-- FIX 6: This table was entirely missing from schema.sql
CREATE TABLE IF NOT EXISTS pending_hospitals (
    id               INTEGER PRIMARY KEY DEFAULT nextval('pending_hosp_seq'),
    hospital_name    VARCHAR(200) NOT NULL,
    email            VARCHAR(150) UNIQUE NOT NULL,
    password_hash    VARCHAR(255) NOT NULL,
    license_number   VARCHAR(100) NOT NULL,
    address          TEXT         NOT NULL,
    phone            VARCHAR(20)  NOT NULL,
    status           VARCHAR(20)  DEFAULT 'pending'
                     CHECK(status IN ('pending','approved','rejected')),
    rejection_reason TEXT,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- ── Blood Requests ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blood_requests (
    id             INTEGER PRIMARY KEY DEFAULT nextval('request_seq'),
    hospital_id    INTEGER NOT NULL,
    blood_group    VARCHAR(5)  NOT NULL,
    units_needed   INTEGER     NOT NULL,
    location       TEXT        NOT NULL,
    emergency_level VARCHAR(20)
                   CHECK(emergency_level IN ('low','medium','high','critical')),
    description    TEXT,
    status         VARCHAR(20) DEFAULT 'pending'
                   CHECK(status IN ('pending','accepted','completed','cancelled')),
    created_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

-- ── Request Responses ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS request_responses (
    id            INTEGER PRIMARY KEY DEFAULT nextval('response_seq'),
    request_id    INTEGER NOT NULL,
    donor_id      INTEGER NOT NULL,
    status        VARCHAR(20) DEFAULT 'pending'
                  CHECK(status IN ('pending','accepted','rejected')),
    response_date TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(request_id) REFERENCES blood_requests(id) ON DELETE CASCADE,
    FOREIGN KEY(donor_id)   REFERENCES donors(id)         ON DELETE CASCADE
);

-- ── Donations ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS donations (
    id            INTEGER PRIMARY KEY DEFAULT nextval('donation_seq'),
    donor_id      INTEGER NOT NULL,
    hospital_id   INTEGER NOT NULL,
    blood_group   VARCHAR(5),
    donation_date DATE,
    units_donated INTEGER,
    remarks       TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(donor_id)   REFERENCES donors(id),
    FOREIGN KEY(hospital_id) REFERENCES hospitals(id)
);

-- ── Notifications ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id         INTEGER PRIMARY KEY DEFAULT nextval('notification_seq'),
    user_id    INTEGER NOT NULL,
    title      VARCHAR(255),
    message    TEXT,
    is_read    BOOLEAN   DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
