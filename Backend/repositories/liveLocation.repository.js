const db = require('../config/db');

const upsert = async (userId, requestId, latitude, longitude, speed, heading, accuracy) => {
    const { rows } = await db.query(
        `INSERT INTO live_locations (user_id, request_id, latitude, longitude, speed, heading, accuracy, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (user_id, request_id)
         DO UPDATE SET latitude = $3, longitude = $4, speed = $5, heading = $6, accuracy = $7, updated_at = NOW()
         RETURNING *`,
        [userId, requestId, latitude, longitude, speed, heading, accuracy]
    );
    return rows[0];
};

const findByRequestId = async (requestId) => {
    const { rows } = await db.query(
        `SELECT ll.*, u.name AS user_name
         FROM live_locations ll
         JOIN users u ON ll.user_id = u.id
         WHERE ll.request_id = $1
         ORDER BY ll.updated_at DESC`,
        [requestId]
    );
    return rows;
};

const findLatestByRequestAndUser = async (requestId, userId) => {
    const { rows } = await db.query(
        `SELECT * FROM live_locations WHERE request_id = $1 AND user_id = $2 ORDER BY updated_at DESC LIMIT 1`,
        [requestId, userId]
    );
    return rows[0] || null;
};

const deleteByRequestAndUser = async (requestId, userId) => {
    await db.query(
        `DELETE FROM live_locations WHERE request_id = $1 AND user_id = $2`,
        [requestId, userId]
    );
};

module.exports = { upsert, findByRequestId, findLatestByRequestAndUser, deleteByRequestAndUser };
