const donorRepo       = require('../repositories/donor.repository');
const requestRepo     = require('../repositories/bloodRequest.repository');
const donationRepo    = require('../repositories/donation.repository');
const notifSvc        = require('./notification.service');
const compatSvc       = require('./bloodCompatibility.service');
const db              = require('../config/db');

const getProfile = async (userId) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');
    return donor;
};

const updateAvailability = async (userId, availability) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');
    return donorRepo.updateAvailability(donor.id, availability);
};

const getMatchingRequests = async (userId) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');

    const compatibleGroups = compatSvc.getCompatibleRecipientGroups(donor.blood_group);
    return requestRepo.findForDonor(donor.id, compatibleGroups);
};

const respondToRequest = async (userId, requestId, action) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');

    // Check eligibility before allowing accept
    if (action === 'accept') {
        const isEligible = donor.eligible_for_donation !== false;
        const nextDate   = donor.next_eligible_date ? new Date(donor.next_eligible_date) : null;
        if (!isEligible && nextDate && nextDate > new Date()) {
            throw new Error(`You are not eligible to donate until ${nextDate.toDateString()}`);
        }
    }

    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Blood request not found');
    if (!['pending','accepted'].includes(request.status)) throw new Error('This request is no longer active');

    const canDonate = compatSvc.isCompatible(donor.blood_group, request.blood_group);
    if (!canDonate) throw new Error('Your blood group is not compatible with this request');

    const { rows: existing } = await db.query(
        'SELECT * FROM request_responses WHERE request_id = $1 AND donor_id = $2',
        [requestId, donor.id]
    );

    const status = action === 'accept' ? 'accepted' : 'rejected';

    if (existing.length > 0) {
        if (existing[0].status === 'donated') throw new Error('You have already donated for this request');
        const { rows } = await db.query(
            `UPDATE request_responses SET status = $1, response_date = NOW()
             WHERE request_id = $2 AND donor_id = $3 RETURNING *`,
            [status, requestId, donor.id]
        );
        return rows[0];
    }

    const { rows } = await db.query(
        `INSERT INTO request_responses (request_id, donor_id, status) VALUES ($1,$2,$3) RETURNING *`,
        [requestId, donor.id, status]
    );

    if (action === 'accept') {
        // Keep request as 'accepted' status
        await requestRepo.updateStatus(requestId, 'accepted');

        // Notify the hospital
        const { rows: hospRows } = await db.query(
            'SELECT h.user_id, h.hospital_name FROM hospitals h WHERE h.id = $1',
            [request.hospital_id]
        );
        if (hospRows[0]?.user_id) {
            await notifSvc.notify(
                hospRows[0].user_id,
                '🩸 Donor Accepted Your Request',
                `${donor.name} (${donor.blood_group}) has accepted your blood request. Phone: ${donor.phone}. Status: Accepted`
            );
        }
    }

    return rows[0];
};

const getDonationHistory = async (userId) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');
    return donationRepo.findByDonorId(donor.id);
};

const getActiveRequest = async (userId) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');

    const { rows } = await db.query(
        `SELECT br.*, h.hospital_name, h.contact_number, h.hospital_address
         FROM request_responses rr
         JOIN blood_requests br ON rr.request_id = br.id
         JOIN hospitals h ON br.hospital_id = h.id
         WHERE rr.donor_id = $1 AND rr.status = 'accepted' AND br.status = 'accepted'
         ORDER BY rr.response_date DESC LIMIT 1`,
        [donor.id]
    );
    return rows[0] || null;
};

const getDashboard = async (userId) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');

    const compatibleGroups = compatSvc.getCompatibleRecipientGroups(donor.blood_group);
    const activeRequests   = await requestRepo.findForDonor(donor.id, compatibleGroups);

    const { rows: acceptedRows } = await db.query(
        `SELECT COUNT(*) FROM request_responses WHERE donor_id = $1 AND status IN ('accepted','donated')`,
        [donor.id]
    );

    const isEligible   = donor.eligible_for_donation !== false;
    const nextEligible = donor.next_eligible_date ? new Date(donor.next_eligible_date) : null;
    const nowEligible  = !nextEligible || nextEligible <= new Date();

    return {
        total_donations:     donor.total_donations,
        last_donation_date:  donor.last_donated_at || donor.last_donation_date,
        next_eligible_date:  donor.next_eligible_date,
        active_requests:     activeRequests.filter(r => !r.my_response_status).length,
        accepted_requests:   parseInt(acceptedRows[0].count),
        availability:        donor.availability,
        blood_group:         donor.blood_group,
        eligible_for_donation: isEligible && nowEligible,
    };
};

module.exports = {
    getProfile, updateAvailability, getMatchingRequests,
    respondToRequest, getDonationHistory, getDashboard,
    getActiveRequest,
};
