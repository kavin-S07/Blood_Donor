const db = require('../config/db');

const updateDonorLocation = async (donorId, requestId, latitude, longitude) => {
    const { rows } = await db.query(
        `INSERT INTO donor_locations (donor_id, request_id, latitude, longitude, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE SET latitude = $3, longitude = $4, updated_at = NOW()
         RETURNING *`,
        [donorId, requestId, latitude, longitude]
    );
    return rows[0];
};

const getDonorLocation = async (donorId, requestId) => {
    const { rows } = await db.query(
        `SELECT * FROM donor_locations WHERE donor_id = $1 AND request_id = $2 ORDER BY updated_at DESC LIMIT 1`,
        [donorId, requestId]
    );
    return rows[0] || null;
};

module.exports = { updateDonorLocation, getDonorLocation };
