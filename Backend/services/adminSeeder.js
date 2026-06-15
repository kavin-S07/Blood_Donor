// services/adminSeeder.js

const bcrypt = require('bcryptjs');
const db     = require('../config/db');

const createDefaultAdmin = async () => {
    try {
        const { rows } = await db.query(
            `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
        );

        if (rows.length > 0) {
            console.log('ℹ️   Admin account already exists — skipping seed');
            return;
        }

        const passwordHash = await bcrypt.hash('Admin1234', 12);

        await db.query(
            `INSERT INTO users (name, email, password, phone, role, is_active)
             VALUES ($1, $2, $3, $4, $5, TRUE)`,
            ['Admin', 'admin@bloodconnect.com', passwordHash, '0000000000', 'admin']
        );

        console.log('✅  Default admin account created  (email: admin@bloodconnect.com)');

    } catch (error) {
        console.error('❌  Admin seeder error:', error.message);
    }
};

module.exports = createDefaultAdmin;
