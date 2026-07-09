// repositories/admin.repository.js

const db = require('../config/db');

class AdminRepository {

    async getDashboardStats() {

        const result = await db.query(`
            SELECT

            (
                SELECT COUNT(*)
                FROM users
                WHERE role='donor'
            ) AS total_donors,

            (
                SELECT COUNT(*)
                FROM users
                WHERE role='hospital'
            ) AS total_hospitals,

            (
                SELECT COUNT(*)
                FROM pending_hospitals
                WHERE status='pending'
            ) AS pending_hospitals,

            (
                SELECT COUNT(*)
                FROM pending_hospitals
                WHERE status='approved'
            ) AS approved_hospitals,

            (
                SELECT COUNT(*)
                FROM pending_hospitals
                WHERE status='rejected'
            ) AS rejected_hospitals,

            (
                SELECT COUNT(*)
                FROM blood_requests
            ) AS total_blood_requests,

            (
                SELECT COUNT(*)
                FROM donations
            ) AS total_donations
        `);

        return result.rows[0];
    }

    async getAllUsers() {

        const result = await db.query(`
            SELECT
                id,
                name,
                email,
                phone,
                role,
                is_active,
                created_at
            FROM users
            ORDER BY created_at DESC
        `);

        return result.rows;
    }

    async getUsersByRole(role) {

        const result = await db.query(
            `
            SELECT
                id,
                name,
                email,
                phone,
                role,
                is_active,
                created_at
            FROM users
            WHERE role = $1
            ORDER BY created_at DESC
            `,
            [role]
        );

        return result.rows;
    }

    async activateUser(userId) {

        const result = await db.query(
            `
            UPDATE users
            SET is_active = TRUE
            WHERE id = $1
            RETURNING *
            `,
            [userId]
        );

        return result.rows[0];
    }

    async deactivateUser(userId) {

        const result = await db.query(
            `
            UPDATE users
            SET is_active = FALSE
            WHERE id = $1
            RETURNING *
            `,
            [userId]
        );

        return result.rows[0];
    }

    async resetPassword(userId, hashedPassword) {

        const result = await db.query(
            `
            UPDATE users
            SET password = $2
            WHERE id = $1
            RETURNING id, name, email, role
            `,
            [userId, hashedPassword]
        );

        return result.rows[0];
    }

    async getAllHospitals() {

        const result = await db.query(`
            SELECT
                h.*,
                u.email,
                u.is_active
            FROM hospitals h
            JOIN users u
            ON h.user_id = u.id
            ORDER BY h.created_at DESC
        `);

        return result.rows;
    }

    async getHospitalById(id) {

        const result = await db.query(
            `
            SELECT
                h.*,
                u.email,
                u.is_active
            FROM hospitals h
            JOIN users u
            ON h.user_id = u.id
            WHERE h.id = $1
            `,
            [id]
        );

        return result.rows[0];
    }

    async searchHospitals(keyword) {

        const result = await db.query(
            `
            SELECT
                h.*,
                u.email
            FROM hospitals h
            JOIN users u
            ON h.user_id = u.id
            WHERE
                LOWER(h.hospital_name)
                LIKE LOWER($1)
            ORDER BY h.created_at DESC
            `,
            [`%${keyword}%`]
        );

        return result.rows;
    }

    async getAllBloodRequests() {

        const result = await db.query(`
            SELECT *
            FROM blood_requests
            ORDER BY created_at DESC
        `);

        return result.rows;
    }

    async getDonationHistory() {

        const result = await db.query(`
            SELECT *
            FROM donations
            ORDER BY created_at DESC
        `);

        return result.rows;
    }

    async getRecentActivity() {

        const result = await db.query(`
            SELECT
                id,
                blood_group,
                status,
                created_at
            FROM blood_requests
            ORDER BY created_at DESC
            LIMIT 10
        `);

        return result.rows;
    }
}

module.exports = new AdminRepository();