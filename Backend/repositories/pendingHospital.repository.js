// repositories/pendingHospital.repository.js

const db = require('../config/db');

class PendingHospitalRepository {

    async create(data) {

        const query = `
            INSERT INTO pending_hospitals
            (
                hospital_name,
                email,
                password_hash,
                license_number,
                address,
                phone,
                status
            )
            VALUES
            (
                $1,$2,$3,$4,$5,$6,'pending'
            )
            RETURNING *
        `;

        const values = [
            data.hospital_name,
            data.email,
            data.password_hash,
            data.license_number,
            data.address,
            data.phone
        ];

        const result = await db.query(query, values);

        return result.rows[0];
    }

    async findById(id) {

        const result = await db.query(
            `
            SELECT *
            FROM pending_hospitals
            WHERE id = $1
            `,
            [id]
        );

        return result.rows[0];
    }

    async findByEmail(email) {

        const result = await db.query(
            `
            SELECT *
            FROM pending_hospitals
            WHERE email = $1
            `,
            [email]
        );

        return result.rows[0];
    }

    async findAll() {

        const result = await db.query(`
            SELECT *
            FROM pending_hospitals
            ORDER BY created_at DESC
        `);

        return result.rows;
    }

    async findByStatus(status) {

        const result = await db.query(
            `
            SELECT *
            FROM pending_hospitals
            WHERE status = $1
            ORDER BY created_at DESC
            `,
            [status]
        );

        return result.rows;
    }

    async updateStatus(id, status) {

        const result = await db.query(
            `
            UPDATE pending_hospitals
            SET
                status = $1,
                updated_at = NOW()
            WHERE id = $2
            RETURNING *
            `,
            [status, id]
        );

        return result.rows[0];
    }

    async approve(id) {

        const result = await db.query(
            `
            UPDATE pending_hospitals
            SET
                status='approved',
                updated_at=NOW()
            WHERE id=$1
            RETURNING *
            `,
            [id]
        );

        return result.rows[0];
    }

    async reject(id, reason) {

        const result = await db.query(
            `
            UPDATE pending_hospitals
            SET
                status='rejected',
                rejection_reason=$2,
                updated_at=NOW()
            WHERE id=$1
            RETURNING *
            `,
            [id, reason]
        );

        return result.rows[0];
    }

    async delete(id) {

        await db.query(
            `
            DELETE FROM pending_hospitals
            WHERE id = $1
            `,
            [id]
        );

        return true;
    }

    async getStatistics() {

        const result = await db.query(`
            SELECT
            COUNT(*) FILTER (WHERE status='pending')
            AS pending,

            COUNT(*) FILTER (WHERE status='approved')
            AS approved,

            COUNT(*) FILTER (WHERE status='rejected')
            AS rejected

            FROM pending_hospitals
        `);

        return result.rows[0];
    }
}

module.exports = new PendingHospitalRepository();