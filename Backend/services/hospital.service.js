const hospitalRepo = require('../repositories/hospital.repository');
const requestRepo  = require('../repositories/bloodRequest.repository');
const donorRepo    = require('../repositories/donor.repository');
const donationRepo = require('../repositories/donation.repository');
const notifSvc     = require('./notification.service');
const compatSvc    = require('./bloodCompatibility.service');
const osrmSvc      = require('./osrm.service');
const db           = require('../config/db');

const getProfile = async (userId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');
    return hospital;
};

const createRequest = async (userId, data) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const request = await requestRepo.create({
        hospital_id:    hospital.id,
        blood_group:    data.blood_group,
        units_needed:   data.units_needed,
        location:       data.location,
        emergency_level: data.emergency_level,
        description:    data.description,
        hospital_latitude:  hospital.latitude ?? null,
        hospital_longitude: hospital.longitude ?? null,
        pickup_latitude:  data.pickup_latitude  ?? hospital.latitude  ?? null,
        pickup_longitude: data.pickup_longitude ?? hospital.longitude ?? null,
    });

    // Find eligible compatible donors
    const donorGroups = compatSvc.getCompatibleDonorGroups(data.blood_group);
    const donors      = await donorRepo.findCompatibleDonors(donorGroups);

    // Calculate nearest donors using OSRM
    const hospitalLat = hospital.latitude;
    const hospitalLng = hospital.longitude;
    let nearestDonors = [];

    if (hospitalLat && hospitalLng && donors.length > 0) {
        const withDistance = await Promise.all(
            donors.map(async (donor) => {
                if (!donor.latitude || !donor.longitude) return { ...donor, distance_km: null, duration_min: null };
                try {
                    const route = await osrmSvc.getRoute(donor.latitude, donor.longitude, hospitalLat, hospitalLng);
                    return {
                        ...donor,
                        distance_km: route ? route.distance_km : osrmSvc.getDistanceBetween(donor.latitude, donor.longitude, hospitalLat, hospitalLng),
                        duration_min: route ? route.duration_min : null,
                    };
                } catch {
                    return {
                        ...donor,
                        distance_km: osrmSvc.getDistanceBetween(donor.latitude, donor.longitude, hospitalLat, hospitalLng),
                        duration_min: null,
                    };
                }
            })
        );
        nearestDonors = withDistance
            .filter(d => d.distance_km !== null)
            .sort((a, b) => a.distance_km - b.distance_km)
            .slice(0, 5);
    }

    const notifPromises = donors.map(donor =>
        notifSvc.notify(
            donor.user_id,
            `\uD83E\uDE78 Blood Needed Urgently \u2013 ${data.blood_group}`,
            `${hospital.hospital_name} needs ${data.units_needed} unit(s) of ${data.blood_group} blood. Location: ${data.location}. Emergency: ${data.emergency_level}`
        ).catch(e => console.error('Notification error:', e.message))
    );

    await Promise.all(notifPromises);

    return { request, notified_donors: donors.length, nearest_donors: nearestDonors };
};

const getRequests = async (userId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');
    return requestRepo.findByHospitalId(hospital.id);
};

const getRequestById = async (userId, requestId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.hospital_id !== hospital.id) throw new Error('Access denied');

    return request;
};

const updateRequest = async (userId, requestId, data) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    const request  = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.hospital_id !== hospital.id) throw new Error('Access denied');

    return requestRepo.update(requestId, data);
};

const deleteRequest = async (userId, requestId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    const request  = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.hospital_id !== hospital.id) throw new Error('Access denied');

    await requestRepo.deleteById(requestId);
};

const getAcceptedDonors = async (userId, requestId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    const request  = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.hospital_id !== hospital.id) throw new Error('Access denied');

    return requestRepo.getAcceptedDonors(requestId);
};

/**
 * Hospital marks a donor as having donated blood.
 * - Creates donation record
 * - Updates request units_received / status
 * - Marks donor ineligible with waiting period
 * - Sends notifications to both donor and hospital
 */
const markDonated = async (userId, requestId, responseId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.hospital_id !== hospital.id) throw new Error('Access denied');

    // Get the response record
    const { rows: respRows } = await db.query(
        `SELECT rr.*, d.blood_group, d.gender, d.id as donor_id, u.id as donor_user_id, u.name as donor_name
         FROM request_responses rr
         JOIN donors d ON rr.donor_id = d.id
         JOIN users u ON d.user_id = u.id
         WHERE rr.id = $1 AND rr.request_id = $2`,
        [responseId, requestId]
    );
    if (!respRows.length) throw new Error('Response record not found');

    const resp  = respRows[0];
    if (resp.status === 'donated') throw new Error('Already marked as donated');
    if (resp.status === 'rejected') throw new Error('This donor was rejected');

    const donatedAt = new Date();

    // 1. Mark the response as donated
    await requestRepo.markResponseDonated(responseId);

    // 2. Create donation record
    const donation = await donationRepo.create({
        donor_id:      resp.donor_id,
        hospital_id:   hospital.id,
        request_id:    requestId,
        blood_group:   resp.blood_group,
        donation_date: donatedAt,
        units_donated: 1,
        status:        'completed',
    });

    // 3. Increment donor total_donations + last_donation_date
    await donorRepo.incrementDonations(resp.donor_id, donatedAt);

    // 4. Mark donor ineligible for waiting period
    await donorRepo.markIneligible(resp.donor_id, donatedAt, resp.gender);

    // 5. Update request units_received
    const updatedRequest = await requestRepo.incrementUnitsReceived(requestId, 1);

    // 6. Notify donor
    const waitDays = resp.gender?.toLowerCase() === 'female' ? 120 : 90;
    const nextEligible = new Date(donatedAt.getTime() + waitDays * 24 * 60 * 60 * 1000);
    await notifSvc.notify(
        resp.donor_user_id,
        '🎉 Donation Completed – Thank You!',
        `Thank you for donating blood at ${hospital.hospital_name}! ` +
        `Donation Date: ${donatedAt.toDateString()}. ` +
        `Next Eligible Date: ${nextEligible.toDateString()}.`
    );

    // 7. Log tracking event
    await logTrackingEvent(requestId, resp.donor_id, responseId, 'completed');

    // 8. Notify via tracking event
    const hospitalUserId = (await db.query('SELECT user_id FROM hospitals WHERE id = $1', [hospital.id])).rows[0].user_id;
    await notifSvc.notifyTrackingEvent('completed', requestId, resp.donor_user_id, hospitalUserId, resp.donor_name, hospital.hospital_name);

    return { donation, updated_request: updatedRequest };
};

/**
 * Hospital rejects a donor who showed up (e.g. low hemoglobin).
 */
const rejectDonorAtHospital = async (userId, requestId, responseId, reason) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.hospital_id !== hospital.id) throw new Error('Access denied');

    const { rows: respRows } = await db.query(
        `SELECT rr.*, u.id as donor_user_id, u.name as donor_name
         FROM request_responses rr
         JOIN donors d ON rr.donor_id = d.id
         JOIN users u ON d.user_id = u.id
         WHERE rr.id = $1 AND rr.request_id = $2`,
        [responseId, requestId]
    );
    if (!respRows.length) throw new Error('Response record not found');

    const resp = respRows[0];
    await requestRepo.markResponseRejected(responseId, reason);

    // Notify donor of rejection
    await notifSvc.notify(
        resp.donor_user_id,
        '❌ Donation Rejected',
        `Your blood donation for request #${requestId} at ${hospital.hospital_name} was not completed. Reason: ${reason}.`
    );

    return { success: true };
};

const getDonationHistory = async (userId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');
    return donationRepo.findByHospitalId(hospital.id);
};

const getNearestDonors = async (userId, requestId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.hospital_id !== hospital.id) throw new Error('Access denied');

    const donorGroups = compatSvc.getCompatibleDonorGroups(request.blood_group);
    const donors = await donorRepo.findCompatibleDonors(donorGroups);

    const hospitalLat = hospital.latitude;
    const hospitalLng = hospital.longitude;

    if (!hospitalLat || !hospitalLng) return [];

    const withDistance = await Promise.all(
        donors.map(async (donor) => {
            if (!donor.latitude || !donor.longitude) return null;
            try {
                const route = await osrmSvc.getRoute(donor.latitude, donor.longitude, hospitalLat, hospitalLng);
                return {
                    donor_id: donor.id,
                    name: donor.name,
                    phone: donor.phone,
                    blood_group: donor.blood_group,
                    city: donor.city,
                    state: donor.state,
                    latitude: donor.latitude,
                    longitude: donor.longitude,
                    distance_km: route ? route.distance_km : osrmSvc.getDistanceBetween(donor.latitude, donor.longitude, hospitalLat, hospitalLng),
                    duration_min: route ? route.duration_min : null,
                };
            } catch {
                return {
                    donor_id: donor.id,
                    name: donor.name,
                    phone: donor.phone,
                    blood_group: donor.blood_group,
                    city: donor.city,
                    state: donor.state,
                    latitude: donor.latitude,
                    longitude: donor.longitude,
                    distance_km: osrmSvc.getDistanceBetween(donor.latitude, donor.longitude, hospitalLat, hospitalLng),
                    duration_min: null,
                };
            }
        })
    );

    return withDistance
        .filter(d => d !== null && d.distance_km !== null)
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, 5);
};

const getDashboard = async (userId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const { rows } = await db.query(
        `SELECT
           COUNT(*) FILTER (WHERE status = 'pending')            AS active_requests,
           COUNT(*) FILTER (WHERE status IN ('completed','partially_completed')) AS completed_requests,
           COUNT(*) FILTER (WHERE status = 'accepted')           AS accepted_requests,
           COUNT(*)                                              AS total_requests,
           COALESCE(SUM(units_received), 0)                      AS total_units_collected
         FROM blood_requests WHERE hospital_id = $1`,
        [hospital.id]
    );

    const { rows: donorRows } = await db.query(
        `SELECT COUNT(DISTINCT rr.donor_id) AS total_accepted_donors
         FROM request_responses rr
         JOIN blood_requests br ON rr.request_id = br.id
         WHERE br.hospital_id = $1 AND rr.status IN ('accepted','donated')`,
        [hospital.id]
    );

    const { rows: donationRows } = await db.query(
        `SELECT COUNT(*) AS total_donations FROM donations WHERE hospital_id = $1`,
        [hospital.id]
    );

    return {
        total_requests:        parseInt(rows[0].total_requests),
        active_requests:       parseInt(rows[0].active_requests),
        completed_requests:    parseInt(rows[0].completed_requests),
        accepted_requests:     parseInt(rows[0].accepted_requests),
        total_accepted_donors: parseInt(donorRows[0].total_accepted_donors),
        total_donations:       parseInt(donationRows[0].total_donations),
        total_units_collected: parseInt(rows[0].total_units_collected),
    };
};

/**
 * Enhanced dashboard with response rate, average response time, and average travel time.
 */
const getEnhancedDashboard = async (userId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const base = await getDashboard(userId);

    const { rows: rateRows } = await db.query(
        `SELECT
           COUNT(*) FILTER (WHERE rr.status IN ('accepted','donated')) AS responded,
           COUNT(*)                                                    AS total_responses,
           ROUND(
             AVG(EXTRACT(EPOCH FROM (rr.response_date - br.created_at)) / 60) FILTER (WHERE rr.status IN ('accepted','donated'))
           , 1)                                                        AS avg_response_time_min
         FROM blood_requests br
         LEFT JOIN request_responses rr ON br.id = rr.request_id
         WHERE br.hospital_id = $1`,
        [hospital.id]
    );

    const { rows: travelRows } = await db.query(
        `SELECT
           ROUND(AVG(dt.travel_time_min), 1) AS avg_travel_time_min,
           ROUND(AVG(dt.donation_time_min), 1) AS avg_donation_time_min
         FROM donation_tracking dt
         JOIN blood_requests br ON dt.request_id = br.id
         WHERE br.hospital_id = $1`,
        [hospital.id]
    );

    const totalResponses = parseInt(rateRows[0].total_responses) || 0;
    const responded = parseInt(rateRows[0].responded) || 0;

    return {
        ...base,
        response_rate: totalResponses > 0 ? Math.round((responded / totalResponses) * 100) : 0,
        avg_response_time_min: rateRows[0].avg_response_time_min,
        avg_travel_time_min: travelRows[0]?.avg_travel_time_min,
        avg_donation_time_min: travelRows[0]?.avg_donation_time_min,
    };
};

/**
 * Analytics: monthly donation stats + blood group distribution.
 */
const getAnalytics = async (userId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const { rows: monthly } = await db.query(
        `SELECT
           EXTRACT(YEAR FROM br.created_at)  AS year,
           EXTRACT(MONTH FROM br.created_at) AS month,
           COUNT(*)                                                          AS total_requests,
           COUNT(*) FILTER (WHERE br.status IN ('completed','partially_completed')) AS completed_requests,
           COALESCE(SUM(dn.units_donated) FILTER (WHERE dn.id IS NOT NULL), 0) AS total_units
         FROM blood_requests br
         LEFT JOIN donations dn ON br.id = dn.request_id
         WHERE br.hospital_id = $1
         GROUP BY year, month
         ORDER BY year DESC, month DESC
         LIMIT 12`,
        [hospital.id]
    );

    const { rows: bloodGroupDist } = await db.query(
        `SELECT
           br.blood_group,
           COUNT(*) AS total_requests,
           COUNT(*) FILTER (WHERE br.status IN ('completed','partially_completed')) AS completed_count
         FROM blood_requests br
         WHERE br.hospital_id = $1
         GROUP BY br.blood_group
         ORDER BY total_requests DESC`,
        [hospital.id]
    );

    const { rows: urgencyDist } = await db.query(
        `SELECT
           br.emergency_level,
           COUNT(*) AS total_requests,
           COUNT(*) FILTER (WHERE br.status IN ('completed','partially_completed')) AS completed_count
         FROM blood_requests br
         WHERE br.hospital_id = $1
         GROUP BY br.emergency_level
         ORDER BY total_requests DESC`,
        [hospital.id]
    );

    return {
        monthly_stats: monthly.map(r => ({
            year: parseInt(r.year),
            month: parseInt(r.month),
            total_requests: parseInt(r.total_requests),
            completed_requests: parseInt(r.completed_requests),
            total_units: parseInt(r.total_units),
        })),
        blood_group_distribution: bloodGroupDist.map(r => ({
            blood_group: r.blood_group,
            total_requests: parseInt(r.total_requests),
            completed_count: parseInt(r.completed_count),
        })),
        urgency_distribution: urgencyDist.map(r => ({
            emergency_level: r.emergency_level,
            total_requests: parseInt(r.total_requests),
            completed_count: parseInt(r.completed_count),
        })),
    };
};

/**
 * Get requests with optional filters: blood_group, status, emergency_level, date_from, date_to
 */
const getFilteredRequests = async (userId, filters) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const conditions = ['br.hospital_id = $1'];
    const values = [hospital.id];
    let paramIndex = 2;

    if (filters.blood_group) {
        conditions.push(`br.blood_group = $${paramIndex++}`);
        values.push(filters.blood_group);
    }
    if (filters.status) {
        conditions.push(`br.status = $${paramIndex++}`);
        values.push(filters.status);
    }
    if (filters.emergency_level) {
        conditions.push(`br.emergency_level = $${paramIndex++}`);
        values.push(filters.emergency_level);
    }
    if (filters.date_from) {
        conditions.push(`br.created_at >= $${paramIndex++}`);
        values.push(filters.date_from);
    }
    if (filters.date_to) {
        conditions.push(`br.created_at <= $${paramIndex++}`);
        values.push(filters.date_to);
    }

    const { rows } = await db.query(
        `SELECT br.*,
                COUNT(rr.id) FILTER (WHERE rr.status = 'accepted') AS accepted_count,
                COUNT(rr.id) FILTER (WHERE rr.status = 'donated')  AS donated_count
         FROM blood_requests br
         LEFT JOIN request_responses rr ON br.id = rr.request_id
         WHERE ${conditions.join(' AND ')}
         GROUP BY br.id
         ORDER BY br.created_at DESC`,
        values
    );
    return rows;
};

/**
 * Filter donors who have interacted with this hospital (accepted/donated/rejected)
 * by blood_group, name, or status.
 */
const getFilteredDonors = async (userId, filters) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const conditions = ['br.hospital_id = $1'];
    const values = [hospital.id];
    let paramIndex = 2;

    if (filters.blood_group) {
        conditions.push(`d.blood_group = $${paramIndex++}`);
        values.push(filters.blood_group);
    }
    if (filters.status) {
        conditions.push(`rr.status = $${paramIndex++}`);
        values.push(filters.status);
    }
    if (filters.name) {
        conditions.push(`u.name ILIKE $${paramIndex++}`);
        values.push(`%${filters.name}%`);
    }

    const { rows } = await db.query(
        `SELECT DISTINCT u.name, u.email, u.phone, u.city, u.state,
                d.blood_group, d.gender, d.id AS donor_id,
                rr.id AS response_id, rr.status AS acceptance_status,
                rr.response_date, rr.donated_at, rr.rejection_reason,
                br.id AS request_id, br.blood_group AS request_blood_group,
                br.emergency_level
         FROM request_responses rr
         JOIN blood_requests br ON rr.request_id = br.id
         JOIN donors d ON rr.donor_id = d.id
         JOIN users u ON d.user_id = u.id
         WHERE ${conditions.join(' AND ')}
         ORDER BY rr.response_date DESC`,
        values
    );
    return rows;
};

/**
 * Get notification logs for this hospital (sent to or from hospital users).
 */
const getNotificationLogs = async (userId, limit = 50) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const safeLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 200);

    const { rows } = await db.query(
        `SELECT nl.*,
                u_sender.name AS sender_name,
                u_recip.name AS recipient_name
         FROM notification_logs nl
         JOIN users u_sender ON nl.sender_id = u_sender.id
         JOIN users u_recip ON nl.recipient_id = u_recip.id
         WHERE nl.sender_id = $1 OR nl.recipient_id = $1
         ORDER BY nl.created_at DESC
         LIMIT $2`,
        [userId, safeLimit]
    );
    return rows;
};

/**
 * Log a tracking event (accepted, travelling, arrived, completed).
 */
const logTrackingEvent = async (requestId, donorId, responseId, eventType) => {
    const now = new Date();
    const columnMap = {
        accepted:   { col: 'accepted_at',   timeCol: 'response_time_min', calc: (r) => r ? (now - new Date(r.created_at)) / 60000 : null },
        travelling: { col: 'travelling_at',  timeCol: null,               calc: null },
        arrived:    { col: 'arrived_at',     timeCol: 'travel_time_min',  calc: (r) => r ? (now - new Date(r.accepted_at)) / 60000 : null },
        completed:  { col: 'completed_at',   timeCol: 'donation_time_min',calc: (r) => r ? (now - new Date(r.arrived_at)) / 60000 : null },
    };
    const mapping = columnMap[eventType];
    if (!mapping) throw new Error(`Unknown tracking event: ${eventType}`);

    const existing = await db.query(
        `SELECT * FROM donation_tracking WHERE request_id = $1 AND donor_id = $2`,
        [requestId, donorId]
    );

    if (existing.rows.length === 0) {
        if (eventType === 'accepted') {
            await db.query(
                `INSERT INTO donation_tracking (request_id, donor_id, response_id, accepted_at, response_time_min)
                 SELECT $1, $2, $3, $4,
                        ROUND(EXTRACT(EPOCH FROM ($4 - br.created_at)) / 60, 1)
                 FROM blood_requests br WHERE br.id = $1`,
                [requestId, donorId, responseId, now]
            );
        }
    } else {
        const rec = existing.rows[0];
        const calcVal = mapping.calc ? mapping.calc(rec) : null;
        const setClauses = [`${mapping.col} = $3`];
        const updateValues = [requestId, donorId, now];
        if (mapping.timeCol && calcVal !== null) {
            setClauses.push(`${mapping.timeCol} = $4`);
            updateValues.push(Math.round(calcVal * 10) / 10);
        }
        await db.query(
            `UPDATE donation_tracking SET ${setClauses.join(', ')} WHERE request_id = $1 AND donor_id = $2`,
            updateValues
        );
    }
};

/**
 * Auto-notify the next nearest eligible donor when a donor is rejected / doesn't show.
 * Finds the next nearest compatible donor who hasn't been notified yet.
 */
const notifyNextNearestDonor = async (userId, requestId) => {
    const hospital = await hospitalRepo.findByUserId(userId);
    if (!hospital) throw new Error('Hospital profile not found');

    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Request not found');
    if (request.hospital_id !== hospital.id) throw new Error('Access denied');

    if (!['pending', 'accepted'].includes(request.status)) {
        throw new Error('Cannot notify donors for a completed/cancelled request');
    }

    const donorGroups = compatSvc.getCompatibleDonorGroups(request.blood_group);
    const allCompatible = await donorRepo.findCompatibleDonors(donorGroups);

    // IDs already notified
    const { rows: existingResponses } = await db.query(
        `SELECT DISTINCT donor_id FROM request_responses WHERE request_id = $1`,
        [requestId]
    );
    const existingIds = new Set(existingResponses.map(r => r.donor_id));

    const unnotified = allCompatible.filter(d => !existingIds.has(d.id));

    if (!unnotified.length) {
        return { notified: false, message: 'No more compatible donors available to notify.' };
    }

    const hospitalLat = hospital.latitude;
    const hospitalLng = hospital.longitude;

    if (!hospitalLat || !hospitalLng) {
        // Just pick the first one
        const donor = unnotified[0];
        await notifSvc.notify(
            donor.user_id,
            `🩸 Blood Needed Urgently – ${request.blood_group}`,
            `${hospital.hospital_name} needs ${request.units_needed} unit(s) of ${request.blood_group} blood. Location: ${request.location}. Emergency: ${request.emergency_level}`
        );
        await db.query(
            `INSERT INTO notification_logs (request_id, sender_id, recipient_id, type, title, message)
             VALUES ($1, $2, $3, 'auto_notify', $4, $5)`,
            [requestId, userId, donor.user_id,
             `🩸 Blood Needed Urgently – ${request.blood_group}`,
             `${hospital.hospital_name} needs ${request.units_needed} unit(s) of ${request.blood_group} blood. Location: ${request.location}.`]
        );
        return { notified: true, donor_id: donor.id, donor_name: donor.name };
    }

    // Sort by distance using OSRM
    const ranked = await osrmSvc.getRoutesForDonorsBatch(unnotified, hospitalLat, hospitalLng);
    const routed = ranked.filter(d => d.distance_km !== null).sort((a, b) => a.distance_km - b.distance_km);

    if (!routed.length) {
        return { notified: false, message: 'No route-available donors found for notification.' };
    }

    const nearest = routed[0];
    await notifSvc.notify(
        nearest.user_id,
        `🩸 Blood Needed Urgently – ${request.blood_group}`,
        `${hospital.hospital_name} needs ${request.units_needed} unit(s) of ${request.blood_group} blood. Location: ${request.location}. Emergency: ${request.emergency_level}`
    );
    await db.query(
        `INSERT INTO notification_logs (request_id, sender_id, recipient_id, type, title, message)
         VALUES ($1, $2, $3, 'auto_notify', $4, $5)`,
        [requestId, userId, nearest.user_id,
         `🩸 Blood Needed Urgently – ${request.blood_group}`,
         `${hospital.hospital_name} needs ${request.units_needed} unit(s) of ${request.blood_group} blood. Location: ${request.location}.`]
    );

    return {
        notified: true,
        donor_id: nearest.id,
        donor_name: nearest.name,
        distance_km: nearest.distance_km,
        duration_min: nearest.duration_min,
    };
};

module.exports = {
    getProfile, createRequest, getRequests, getRequestById,
    updateRequest, deleteRequest, getAcceptedDonors,
    markDonated, rejectDonorAtHospital,
    getDonationHistory, getDashboard, getEnhancedDashboard,
    getAnalytics, getFilteredRequests, getFilteredDonors,
    getNotificationLogs, logTrackingEvent, notifyNextNearestDonor,
    getNearestDonors,
};
