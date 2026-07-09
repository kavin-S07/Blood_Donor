const liveTrackingSvc = require('../services/liveTracking.service');
const requestRepo = require('../repositories/bloodRequest.repository');
const hospitalRepo = require('../repositories/hospital.repository');
const res_ = require('../utils/responseHandler');

const getLiveLocation = async (req, res, next) => {
    try {
        const requestId = parseInt(req.params.id, 10);
        if (Number.isNaN(requestId)) return res_.error(res, 'Invalid request id', 400);

        const request = await requestRepo.findById(requestId);
        if (!request) return res_.error(res, 'Blood request not found', 404);

        const hospital = await hospitalRepo.findByUserId(req.user.userId);
        if (!hospital || hospital.id !== request.hospital_id) {
            return res_.error(res, 'Access denied: only the requesting hospital can view live location', 403);
        }

        const location = await liveTrackingSvc.getLiveLocation(requestId);
        if (!location) return res_.error(res, 'No live location available', 404);

        return res_.success(res, location, 'Live location retrieved');
    } catch (err) {
        next(err);
    }
};

const getTracking = async (req, res, next) => {
    try {
        const requestId = parseInt(req.params.id, 10);
        if (Number.isNaN(requestId)) return res_.error(res, 'Invalid request id', 400);

        const request = await requestRepo.findById(requestId);
        if (!request) return res_.error(res, 'Blood request not found', 404);

        const hospital = await hospitalRepo.findByUserId(req.user.userId);
        if (!hospital || hospital.id !== request.hospital_id) {
            return res_.error(res, 'Access denied: only the requesting hospital can view tracking data', 403);
        }

        const tracking = await liveTrackingSvc.getTrackingInfo(requestId);
        if (!tracking) return res_.error(res, 'Tracking info unavailable', 404);

        return res_.success(res, tracking, 'Tracking data retrieved');
    } catch (err) {
        next(err);
    }
};

module.exports = { getLiveLocation, getTracking };
