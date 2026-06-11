const db = require('../config/db');

const create = async (userId, title, message) => {
    const { rows } = await db.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ($1,$2,$3) RETURNING *`,
        [userId, title, message]
    );
    return rows[0];
};

const createBulk = async (notifications) => {
    if (!notifications.length) return [];
    const values = notifications.flatMap((n, i) => [n.userId, n.title, n.message]);
    const placeholders = notifications
        .map((_, i) => `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`)
        .join(', ');
    const { rows } = await db.query(
        `INSERT INTO notifications (user_id, title, message) VALUES ${placeholders} RETURNING *`,
        values
    );
    return rows;
};

const findByUserId = async (userId) => {
    const { rows } = await db.query(
        `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
    );
    return rows;
};

const markRead = async (id, userId) => {
    const { rows } = await db.query(
        `UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *`,
        [id, userId]
    );
    return rows[0] || null;
};

const markAllRead = async (userId) => {
    await db.query(
        `UPDATE notifications SET is_read = true WHERE user_id = $1`,
        [userId]
    );
};

const deleteById = async (id, userId) => {
    const { rowCount } = await db.query(
        `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
        [id, userId]
    );
    return rowCount > 0;
};

const unreadCount = async (userId) => {
    const { rows } = await db.query(
        `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false`,
        [userId]
    );
    return parseInt(rows[0].count);
};

module.exports = {
    create, createBulk, findByUserId,
    markRead, markAllRead, deleteById, unreadCount,
};
