const donorRepo  = require('../repositories/donor.repository');
const requestRepo = require('../repositories/bloodRequest.repository');
const navigationSvc = require('../services/navigation.service');
const res_ = require('../utils/responseHandler');

// GET /api/request/:id/route?donorLat=..&donorLng=..
const getRequestRoute = async (req, res, next) => {
    try {
        const donor = await donorRepo.findByUserId(req.user.userId);
        if (!donor) return res_.error(res, 'Donor profile not found', 404);

        const requestId = parseInt(req.params.id, 10);
        if (Number.isNaN(requestId)) return res_.error(res, 'Invalid request id', 400);

        const request = await requestRepo.findById(requestId);
        if (!request) return res_.error(res, 'Blood request not found', 404);

        const donorLat = parseFloat(req.query.donorLat);
        const donorLng = parseFloat(req.query.donorLng);
        if (Number.isNaN(donorLat) || Number.isNaN(donorLng)) {
            return res_.error(res, 'donorLat and donorLng query parameters are required', 400);
        }
        if (donorLat < -90 || donorLat > 90 || donorLng < -180 || donorLng > 180) {
            return res_.error(res, 'donorLat/donorLng are out of range', 400);
        }

        const data = await navigationSvc.getRequestRoute(donor, request, donorLat, donorLng);
        return res_.success(res, data, 'Route calculated');
    } catch (err) {
        if (err.statusCode) return res_.error(res, err.message, err.statusCode);
        if (err.message.includes('not responded') || err.message.includes('must accept')) {
            return res_.error(res, err.message, 400);
        }
        if (err.message.includes('location is not available')) {
            return res_.error(res, err.message, 400);
        }
        next(err);
    }
};

module.exports = { getRequestRoute };