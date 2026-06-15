const db = require('../config/db');

const create = async (request) => {
    const { rows } = await db.query(
        `INSERT INTO blood_requests (hospital_id, blood_group, units_needed, location, emergency_level, description)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [request.hospital_id, request.blood_group, request.units_needed,
         request.location, request.emergency_level, request.description]
    );
    return rows[0];
};

const findById = async (id) => {
    const { rows } = await db.query(
        `SELECT br.*, h.hospital_name, h.hospital_address, h.contact_number,
                u.name as hospital_user_name, u.email as hospital_email
         FROM blood_requests br
         JOIN hospitals h ON br.hospital_id = h.id
         JOIN users u ON h.user_id = u.id
         WHERE br.id = $1`,
        [id]
    );
    return rows[0] || null;
};

const findByHospitalId = async (hospitalId) => {
    const { rows } = await db.query(
        `SELECT br.*,
                COUNT(rr.id) FILTER (WHERE rr.status = 'accepted') AS accepted_count,
                COUNT(rr.id) FILTER (WHERE rr.status = 'donated')  AS donated_count
         FROM blood_requests br
         LEFT JOIN request_responses rr ON br.id = rr.request_id
         WHERE br.hospital_id = $1
         GROUP BY br.id
         ORDER BY br.created_at DESC`,
        [hospitalId]
    );
    return rows;
};

// Requests visible to donors: matching compatible blood groups, pending
const findForDonor = async (donorId, compatibleGroups) => {
    const placeholders = compatibleGroups.map((_, i) => `$${i + 2}`).join(', ');
    const { rows } = await db.query(
        `SELECT br.*, h.hospital_name, h.contact_number, h.hospital_address,
                rr.status AS my_response_status
         FROM blood_requests br
         JOIN hospitals h ON br.hospital_id = h.id
         LEFT JOIN request_responses rr ON br.id = rr.request_id AND rr.donor_id = $1
         WHERE br.status IN ('pending','accepted') AND br.blood_group IN (${placeholders})
         ORDER BY
           CASE br.emergency_level
             WHEN 'critical' THEN 1 WHEN 'high' THEN 2
             WHEN 'medium' THEN 3 ELSE 4 END,
           br.created_at DESC`,
        [donorId, ...compatibleGroups]
    );
    return rows;
};

const updateStatus = async (id, status) => {
    const { rows } = await db.query(
        `UPDATE blood_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, id]
    );
    return rows[0];
};

const update = async (id, fields) => {
    const keys   = Object.keys(fields);
    const values = Object.values(fields);
    const setClauses = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const { rows } = await db.query(
        `UPDATE blood_requests SET ${setClauses}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`,
        [...values, id]
    );
    return rows[0];
};

const deleteById = async (id) => {
    await db.query('DELETE FROM blood_requests WHERE id = $1', [id]);
};

// Get accepted donors for a specific request with their acceptance status
const getAcceptedDonors = async (requestId) => {
    const { rows } = await db.query(
        `SELECT u.name, u.email, u.phone, u.city, u.state,
                d.blood_group, d.gender, d.id as donor_id,
                rr.id as response_id, rr.response_date, rr.status as acceptance_status,
                rr.rejection_reason, rr.donated_at
         FROM request_responses rr
         JOIN donors d ON rr.donor_id = d.id
         JOIN users u ON d.user_id = u.id
         WHERE rr.request_id = $1 AND rr.status IN ('accepted','donated','rejected')
         ORDER BY rr.response_date DESC`,
        [requestId]
    );
    return rows;
};

// Mark a specific donor response as donated
const markResponseDonated = async (responseId) => {
    const { rows } = await db.query(
        `UPDATE request_responses SET status = 'donated', donated_at = NOW()
         WHERE id = $1 RETURNING *`,
        [responseId]
    );
    return rows[0];
};

// Mark a specific donor response as rejected with reason
const markResponseRejected = async (responseId, reason) => {
    const { rows } = await db.query(
        `UPDATE request_responses SET status = 'rejected', rejection_reason = $1
         WHERE id = $2 RETURNING *`,
        [reason, responseId]
    );
    return rows[0];
};

// Increment units received and auto-set status
const incrementUnitsReceived = async (requestId, units) => {
    const { rows } = await db.query(
        `UPDATE blood_requests
         SET units_received = COALESCE(units_received, 0) + $1,
             status = CASE
               WHEN COALESCE(units_received, 0) + $1 >= units_needed THEN 'completed'
               ELSE 'partially_completed'
             END,
             updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [units, requestId]
    );
    return rows[0];
};

module.exports = {
    create, findById, findByHospitalId,
    findForDonor, updateStatus, update,
    deleteById, getAcceptedDonors,
    markResponseDonated, markResponseRejected,
    incrementUnitsReceived,
};
