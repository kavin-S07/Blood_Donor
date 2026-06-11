const db = require('../config/db');

const create = async (donation) => {
    const { rows } = await db.query(
        `INSERT INTO donations (donor_id, hospital_id, blood_group, donation_date, units_donated, remarks)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [donation.donor_id, donation.hospital_id, donation.blood_group,
         donation.donation_date, donation.units_donated, donation.remarks]
    );
    return rows[0];
};

const findByDonorId = async (donorId) => {
    const { rows } = await db.query(
        `SELECT dn.*, h.hospital_name, h.hospital_address
         FROM donations dn
         JOIN hospitals h ON dn.hospital_id = h.id
         WHERE dn.donor_id = $1
         ORDER BY dn.donation_date DESC`,
        [donorId]
    );
    return rows;
};

const findByHospitalId = async (hospitalId) => {
    const { rows } = await db.query(
        `SELECT dn.*, u.name as donor_name, u.phone as donor_phone, d.blood_group
         FROM donations dn
         JOIN donors d ON dn.donor_id = d.id
         JOIN users u ON d.user_id = u.id
         WHERE dn.hospital_id = $1
         ORDER BY dn.donation_date DESC`,
        [hospitalId]
    );
    return rows;
};

module.exports = { create, findByDonorId, findByHospitalId };
