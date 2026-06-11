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

// Requests the donor is eligible for based on blood compatibility
const getMatchingRequests = async (userId) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');

    const compatibleGroups = compatSvc.getCompatibleRecipientGroups(donor.blood_group);
    return requestRepo.findForDonor(donor.id, compatibleGroups);
};

const respondToRequest = async (userId, requestId, action) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');

    const request = await requestRepo.findById(requestId);
    if (!request) throw new Error('Blood request not found');
    if (request.status !== 'pending') throw new Error('This request is no longer active');

    // Check blood compatibility
    const canDonate = compatSvc.isCompatible(donor.blood_group, request.blood_group);
    if (!canDonate) throw new Error('Your blood group is not compatible with this request');

    // Check if already responded
    const { rows: existing } = await db.query(
        'SELECT * FROM request_responses WHERE request_id = $1 AND donor_id = $2',
        [requestId, donor.id]
    );

    const status = action === 'accept' ? 'accepted' : 'rejected';

    if (existing.length > 0) {
        // Update existing response
        const { rows } = await db.query(
            `UPDATE request_responses SET status = $1, response_date = NOW()
             WHERE request_id = $2 AND donor_id = $3 RETURNING *`,
            [status, requestId, donor.id]
        );

        if (action === 'accept') {
            // Update blood request status to accepted
            await requestRepo.updateStatus(requestId, 'accepted');
        }

        return rows[0];
    }

    // Insert new response
    const { rows } = await db.query(
        `INSERT INTO request_responses (request_id, donor_id, status) VALUES ($1,$2,$3) RETURNING *`,
        [requestId, donor.id, status]
    );

    if (action === 'accept') {
        await requestRepo.updateStatus(requestId, 'accepted');

        // Notify the hospital user
        const { rows: hospRows } = await db.query(
            'SELECT user_id FROM hospitals WHERE id = $1', [request.hospital_id]
        );
        if (hospRows[0]?.user_id) {
            await notifSvc.notify(
                hospRows[0].user_id,
                'Donor Accepted Request',
                `${donor.name} (${donor.blood_group}) has accepted your blood request for ${request.blood_group}.`
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

const getDashboard = async (userId) => {
    const donor = await donorRepo.findByUserId(userId);
    if (!donor) throw new Error('Donor profile not found');

    const compatibleGroups = compatSvc.getCompatibleRecipientGroups(donor.blood_group);
    const activeRequests   = await requestRepo.findForDonor(donor.id, compatibleGroups);

    const { rows: acceptedRows } = await db.query(
        `SELECT COUNT(*) FROM request_responses WHERE donor_id = $1 AND status = 'accepted'`,
        [donor.id]
    );

    return {
        total_donations:   donor.total_donations,
        last_donation_date: donor.last_donation_date,
        active_requests:   activeRequests.filter(r => !r.my_response_status).length,
        accepted_requests: parseInt(acceptedRows[0].count),
        availability:      donor.availability,
        blood_group:       donor.blood_group,
    };
};

module.exports = {
    getProfile, updateAvailability, getMatchingRequests,
    respondToRequest, getDonationHistory, getDashboard,
};
