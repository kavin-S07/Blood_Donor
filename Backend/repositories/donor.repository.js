const db = require('../config/db');

const create = async (donor) => {
    const { rows } = await db.query(
        `INSERT INTO donors (user_id, blood_group, age, gender, availability, last_donation_date, total_donations)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [donor.user_id, donor.blood_group, donor.age, donor.gender,
         donor.availability ?? true, donor.last_donation_date || null, donor.total_donations ?? 0]
    );
    return rows[0];
};

const findByUserId = async (userId) => {
    const { rows } = await db.query(
        `SELECT d.*, u.name, u.email, u.phone, u.city, u.state, u.address
         FROM donors d JOIN users u ON d.user_id = u.id
         WHERE d.user_id = $1`,
        [userId]
    );
    return rows[0] || null;
};

const findById = async (id) => {
    const { rows } = await db.query(
        `SELECT d.*, u.name, u.email, u.phone, u.city, u.state
         FROM donors d JOIN users u ON d.user_id = u.id
         WHERE d.id = $1`,
        [id]
    );
    return rows[0] || null;
};

// Find eligible donors whose blood group is compatible
const findCompatibleDonors = async (compatibleGroups) => {
    const placeholders = compatibleGroups.map((_, i) => `$${i + 1}`).join(', ');
    const { rows } = await db.query(
        `SELECT d.*, u.name, u.email, u.phone, u.city, u.state,
                u.latitude, u.longitude, u.formatted_address
         FROM donors d JOIN users u ON d.user_id = u.id
         WHERE d.availability = true
           AND COALESCE(d.eligible_for_donation, true) = true
           AND (d.next_eligible_date IS NULL OR d.next_eligible_date <= CURRENT_TIMESTAMP)
           AND d.blood_group IN (${placeholders})`,
        compatibleGroups
    );
    return rows;
};

const updateAvailability = async (donorId, availability) => {
    const { rows } = await db.query(
        'UPDATE donors SET availability = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
        [availability, donorId]
    );
    return rows[0];
};

const update = async (donorId, fields) => {
    const keys   = Object.keys(fields);
    const values = Object.values(fields);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await db.query(
        `UPDATE donors SET ${setClauses}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, donorId]
    );
    return rows[0];
};

const incrementDonations = async (donorId, donationDate) => {
    await db.query(
        `UPDATE donors
         SET total_donations = total_donations + 1, last_donation_date = $1, updated_at = NOW()
         WHERE id = $2`,
        [donationDate, donorId]
    );
};

/**
 * After a completed donation, mark donor ineligible for 90 days (male) or 120 days (female)
 */
const markIneligible = async (donorId, donatedAt, gender) => {
    const waitDays = gender?.toLowerCase() === 'female' ? 120 : 90;
    const { rows } = await db.query(
        `UPDATE donors
         SET eligible_for_donation = false,
             last_donated_at       = $1,
             next_eligible_date    = $1 + INTERVAL '1 day' * $2,
             updated_at            = NOW()
         WHERE id = $3 RETURNING *`,
        [donatedAt, waitDays, donorId]
    );
    return rows[0];
};

module.exports = {
    create, findByUserId, findById,
    findCompatibleDonors, updateAvailability,
    update, incrementDonations, markIneligible,
};
