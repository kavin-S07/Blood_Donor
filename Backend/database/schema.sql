CREATE SEQUENCE user_seq START 10000;
CREATE SEQUENCE donor_seq START 20000;
CREATE SEQUENCE hospital_seq START 30000;
CREATE SEQUENCE request_seq START 40000;
CREATE SEQUENCE response_seq START 50000;
CREATE SEQUENCE donation_seq START 600000;
CREATE SEQUENCE notification_seq START 700000;


CREATE TABLE users (
    id INTEGER PRIMARY KEY DEFAULT nextval('user_seq'),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK(role IN ('donor','hospital')),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donors (
    id INTEGER PRIMARY KEY DEFAULT nextval('donor_seq'),
    user_id INTEGER UNIQUE NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20),
    availability BOOLEAN DEFAULT TRUE,
    last_donation_date DATE,
    total_donations INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);


CREATE TABLE hospitals (
    id INTEGER PRIMARY KEY DEFAULT nextval('hospital_seq'),
    user_id INTEGER UNIQUE NOT NULL,
    hospital_name VARCHAR(200) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    hospital_address TEXT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE blood_requests (
    id INTEGER PRIMARY KEY DEFAULT nextval('request_seq'),
    hospital_id INTEGER NOT NULL,
    blood_group VARCHAR(5) NOT NULL,
    units_needed INTEGER NOT NULL,
    location TEXT NOT NULL,
    emergency_level VARCHAR(20)
    CHECK(emergency_level IN ('low','medium','high','critical')),
    description TEXT,
    status VARCHAR(20)
    DEFAULT 'pending'
    CHECK(status IN ('pending','accepted','completed','cancelled')),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(hospital_id)
    REFERENCES hospitals(id)
    ON DELETE CASCADE
);

CREATE TABLE request_responses (
    id INTEGER PRIMARY KEY DEFAULT nextval('response_seq'),
    request_id INTEGER NOT NULL,
    donor_id INTEGER NOT NULL,
    status VARCHAR(20)
    DEFAULT 'pending'
    CHECK(status IN ('pending','accepted','rejected')),
    response_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(request_id)
    REFERENCES blood_requests(id)
    ON DELETE CASCADE,

    FOREIGN KEY(donor_id)
    REFERENCES donors(id)
    ON DELETE CASCADE
);

CREATE TABLE donations (
    id INTEGER PRIMARY KEY DEFAULT nextval('donation_seq'),
    donor_id INTEGER NOT NULL,
    hospital_id INTEGER NOT NULL,
    blood_group VARCHAR(5),
    donation_date DATE,
    units_donated INTEGER,
    remarks TEXT,

    FOREIGN KEY(donor_id)
    REFERENCES donors(id),

    FOREIGN KEY(hospital_id)
    REFERENCES hospitals(id)
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY DEFAULT nextval('notification_seq'),
    user_id INTEGER NOT NULL,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY(user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);