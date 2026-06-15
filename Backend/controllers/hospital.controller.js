const hospitalService = require('../services/hospital.service');
const res_ = require('../utils/responseHandler');

const createRequest = async (req, res, next) => {
    try {
        const result = await hospitalService.createRequest(req.user.userId, req.body);
        return res_.created(res, result, `Blood request created. ${result.notified_donors} donor(s) notified.`);
    } catch (err) { next(err); }
};

const getRequests = async (req, res, next) => {
    try {
        const data = await hospitalService.getRequests(req.user.userId);
        return res_.success(res, data);
    } catch (err) { next(err); }
};

const getRequestById = async (req, res, next) => {
    try {
        const data = await hospitalService.getRequestById(req.user.userId, parseInt(req.params.id));
        return res_.success(res, data);
    } catch (err) {
        if (err.message === 'Request not found') return res_.error(res, err.message, 404);
        if (err.message === 'Access denied') return res_.error(res, err.message, 403);
        next(err);
    }
};

const updateRequest = async (req, res, next) => {
    try {
        const data = await hospitalService.updateRequest(req.user.userId, parseInt(req.params.id), req.body);
        return res_.success(res, data, 'Request updated');
    } catch (err) {
        if (err.message === 'Request not found') return res_.error(res, err.message, 404);
        next(err);
    }
};

const deleteRequest = async (req, res, next) => {
    try {
        await hospitalService.deleteRequest(req.user.userId, parseInt(req.params.id));
        return res_.success(res, {}, 'Request deleted');
    } catch (err) {
        if (err.message === 'Request not found') return res_.error(res, err.message, 404);
        next(err);
    }
};

const getAcceptedDonors = async (req, res, next) => {
    try {
        const data = await hospitalService.getAcceptedDonors(req.user.userId, parseInt(req.params.id));
        return res_.success(res, data);
    } catch (err) {
        if (err.message === 'Request not found') return res_.error(res, err.message, 404);
        next(err);
    }
};

const markDonated = async (req, res, next) => {
    try {
        const data = await hospitalService.markDonated(
            req.user.userId,
            parseInt(req.params.id),
            parseInt(req.params.responseId)
        );
        return res_.success(res, data, 'Donation marked as completed');
    } catch (err) {
        if (err.message.includes('not found')) return res_.error(res, err.message, 404);
        if (err.message.includes('Access denied')) return res_.error(res, err.message, 403);
        if (err.message.includes('Already')) return res_.error(res, err.message, 409);
        next(err);
    }
};

const rejectDonor = async (req, res, next) => {
    try {
        const { reason } = req.body;
        if (!reason) return res_.error(res, 'Rejection reason is required', 400);
        const data = await hospitalService.rejectDonorAtHospital(
            req.user.userId,
            parseInt(req.params.id),
            parseInt(req.params.responseId),
            reason
        );
        return res_.success(res, data, 'Donor marked as rejected');
    } catch (err) {
        if (err.message.includes('not found')) return res_.error(res, err.message, 404);
        next(err);
    }
};

const getDonationHistory = async (req, res, next) => {
    try {
        const data = await hospitalService.getDonationHistory(req.user.userId);
        return res_.success(res, data);
    } catch (err) { next(err); }
};

const getDashboard = async (req, res, next) => {
    try {
        const data = await hospitalService.getDashboard(req.user.userId);
        return res_.success(res, data);
    } catch (err) { next(err); }
};

module.exports = {
    createRequest, getRequests, getRequestById,
    updateRequest, deleteRequest, getAcceptedDonors,
    markDonated, rejectDonor,
    getDonationHistory, getDashboard,
};
