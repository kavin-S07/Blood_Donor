const db = require('../config/db');

const findByEmail = async (email) => {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
};

const findById = async (id) => {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
};

const create = async (user) => {
    const { rows } = await db.query(
        `INSERT INTO users (name, email, password, phone, address, city, state, role,
                             latitude, longitude, formatted_address)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [user.name, user.email, user.password, user.phone,
         user.address, user.city, user.state, user.role,
         user.latitude ?? null, user.longitude ?? null, user.formatted_address ?? null]
    );
    return rows[0];
};

const update = async (id, fields) => {
    const keys   = Object.keys(fields);
    const values = Object.values(fields);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await db.query(
        `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id]
    );
    return rows[0];
};

const updatePassword = async (id, hashedPassword) => {
    await db.query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, id]
    );
};

module.exports = { findByEmail, findById, create, update, updatePassword };
