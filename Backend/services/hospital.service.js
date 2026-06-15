const hospitalRepo = require('../repositories/hospital.repository');
const requestRepo  = require('../repositories/bloodRequest.repository');
const donorRepo    = require('../repositories/donor.repository');
const donationRepo = require('../repositories/donation.repository');
const notifSvc     = require('./notification.service');
const compatSvc    = require('./bloodCompatibility.service');
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
    });

    // Find eligible compatible donors
    const donorGroups = compatSvc.getCompatibleDonorGroups(data.blood_group);
    const donors      = await donorRepo.findCompatibleDonors(donorGroups);

    const notifPromises = donors.map(donor =>
        notifSvc.notify(
            donor.user_id,
            `🩸 Blood Needed Urgently – ${data.blood_group}`,
            `${hospital.hospital_name} needs ${data.units_needed} unit(s) of ${data.blood_group} blood. Location: ${data.location}. Emergency: ${data.emergency_level}`
        ).catch(e => console.error('Notification error:', e.message))
    );

    await Promise.all(notifPromises);

    return { request, notified_donors: donors.length };
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

    // 7. Notify hospital user
    await notifSvc.notify(
        (await db.query('SELECT user_id FROM hospitals WHERE id = $1', [hospital.id])).rows[0].user_id,
        '✅ Donation Recorded',
        `${resp.donor_name} (${resp.blood_group}) has successfully donated blood for request #${requestId}.`
    );

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

module.exports = {
    getProfile, createRequest, getRequests, getRequestById,
    updateRequest, deleteRequest, getAcceptedDonors,
    markDonated, rejectDonorAtHospital,
    getDonationHistory, getDashboard,
};
