const hospitalRepo = require('../repositories/hospital.repository');
const requestRepo  = require('../repositories/bloodRequest.repository');
const donorRepo    = require('../repositories/donor.repository');
const donationRepo = require('../repositories/donation.repository');
const notifSvc     = require('./notification.service');
const emailSvc     = require('./email.service');
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

    // Find compatible donors and notify them
    const donorGroups  = compatSvc.getCompatibleDonorGroups(data.blood_group);
    const donors       = await donorRepo.findCompatibleDonors(donorGroups);

    // Send emails + in-app notifications in parallel (fire and forget errors)
    const emailPromises = donors.map(donor =>
        emailSvc.sendBloodRequestEmail(donor, request, hospital).catch(e =>
            console.error(`Email failed for ${donor.email}:`, e.message)
        )
    );

    const notifPromises = donors.map(donor =>
        notifSvc.notify(
            donor.user_id,
            `🩸 Blood Request - ${data.blood_group}`,
            `${hospital.hospital_name} needs ${data.units_needed} unit(s) of ${data.blood_group} blood. Emergency: ${data.emergency_level}`
        ).catch(e => console.error('Notification error:', e.message))
    );

    await Promise.all([...emailPromises, ...notifPromises]);

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
           COUNT(*) FILTER (WHERE status = 'pending')   AS active_requests,
           COUNT(*) FILTER (WHERE status = 'completed') AS completed_requests,
           COUNT(*) FILTER (WHERE status = 'accepted')  AS accepted_requests
         FROM blood_requests WHERE hospital_id = $1`,
        [hospital.id]
    );

    const { rows: donorRows } = await db.query(
        `SELECT COUNT(DISTINCT rr.donor_id) AS total_accepted_donors
         FROM request_responses rr
         JOIN blood_requests br ON rr.request_id = br.id
         WHERE br.hospital_id = $1 AND rr.status = 'accepted'`,
        [hospital.id]
    );

    const { rows: donationRows } = await db.query(
        `SELECT COUNT(*) AS total_donations FROM donations WHERE hospital_id = $1`,
        [hospital.id]
    );

    return {
        active_requests:       parseInt(rows[0].active_requests),
        completed_requests:    parseInt(rows[0].completed_requests),
        accepted_requests:     parseInt(rows[0].accepted_requests),
        total_accepted_donors: parseInt(donorRows[0].total_accepted_donors),
        total_donations:       parseInt(donationRows[0].total_donations),
    };
};

module.exports = {
    getProfile, createRequest, getRequests, getRequestById,
    updateRequest, deleteRequest, getAcceptedDonors,
    getDonationHistory, getDashboard,
};
