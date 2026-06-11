const donorService = require('../services/donor.service');
const res_ = require('../utils/responseHandler');

const getMatchingRequests = async (req, res, next) => {
    try {
        const data = await donorService.getMatchingRequests(req.user.userId);
        return res_.success(res, data);
    } catch (err) { next(err); }
};

const acceptRequest = async (req, res, next) => {
    try {
        const data = await donorService.respondToRequest(req.user.userId, parseInt(req.params.id), 'accept');
        return res_.success(res, data, 'Request accepted successfully');
    } catch (err) {
        if (err.message.includes('not found')) return res_.error(res, err.message, 404);
        if (err.message.includes('compatible')) return res_.error(res, err.message, 400);
        next(err);
    }
};

const rejectRequest = async (req, res, next) => {
    try {
        const data = await donorService.respondToRequest(req.user.userId, parseInt(req.params.id), 'reject');
        return res_.success(res, data, 'Request rejected');
    } catch (err) {
        if (err.message.includes('not found')) return res_.error(res, err.message, 404);
        next(err);
    }
};

const updateAvailability = async (req, res, next) => {
    try {
        const { availability } = req.body;
        if (typeof availability !== 'boolean') {
            return res_.error(res, 'availability must be a boolean', 400);
        }
        const data = await donorService.updateAvailability(req.user.userId, availability);
        return res_.success(res, data, 'Availability updated');
    } catch (err) { next(err); }
};

const getDonationHistory = async (req, res, next) => {
    try {
        const data = await donorService.getDonationHistory(req.user.userId);
        return res_.success(res, data);
    } catch (err) { next(err); }
};

const getDashboard = async (req, res, next) => {
    try {
        const data = await donorService.getDashboard(req.user.userId);
        return res_.success(res, data);
    } catch (err) { next(err); }
};

module.exports = {
    getMatchingRequests, acceptRequest, rejectRequest,
    updateAvailability, getDonationHistory, getDashboard,
};
