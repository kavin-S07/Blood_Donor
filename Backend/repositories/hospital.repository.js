const db = require('../config/db');

const create = async (hospital) => {
    const { rows } = await db.query(
        `INSERT INTO hospitals (user_id, hospital_name, license_number, hospital_address, contact_number)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [hospital.user_id, hospital.hospital_name, hospital.license_number,
         hospital.hospital_address, hospital.contact_number]
    );
    return rows[0];
};

const findByUserId = async (userId) => {
    const { rows } = await db.query(
        `SELECT h.*, u.name, u.email, u.phone, u.city, u.state
         FROM hospitals h JOIN users u ON h.user_id = u.id
         WHERE h.user_id = $1`,
        [userId]
    );
    return rows[0] || null;
};

const findById = async (id) => {
    const { rows } = await db.query(
        `SELECT h.*, u.name, u.email, u.phone, u.city, u.state
         FROM hospitals h JOIN users u ON h.user_id = u.id
         WHERE h.id = $1`,
        [id]
    );
    return rows[0] || null;
};

const update = async (hospitalId, fields) => {
    const keys   = Object.keys(fields);
    const values = Object.values(fields);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await db.query(
        `UPDATE hospitals SET ${setClauses}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, hospitalId]
    );
    return rows[0];
};

module.exports = { create, findByUserId, findById, update };
