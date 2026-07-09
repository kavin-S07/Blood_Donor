const hospitalRepo = require('../repositories/hospital.repository');
const requestRepo  = require('../repositories/bloodRequest.repository');
const matchingSvc  = require('../services/donorMatching.service');
const res_         = require('../utils/responseHandler');

// GET /api/donor/nearest
const getNearestForHospital = async (req, res, next) => {
    try {
        const hospital = await hospitalRepo.findByUserId(req.user.userId);
        if (!hospital) return res_.error(res, 'Hospital profile not found', 404);

        const data = await matchingSvc.findNearestDonorsForHospital(hospital, req.query.limit);
        return res_.success(res, data);
    } catch (err) { next(err); }
};

// GET /api/request/:id/nearest
const getNearestForRequest = async (req, res, next) => {
    try {
        const hospital = await hospitalRepo.findByUserId(req.user.userId);
        if (!hospital) return res_.error(res, 'Hospital profile not found', 404);

        const request = await requestRepo.findById(parseInt(req.params.id));
        if (!request) return res_.error(res, 'Blood request not found', 404);
        if (request.hospital_id !== hospital.id) return res_.error(res, 'Access denied', 403);

        const data = await matchingSvc.findNearestDonorsForRequest(hospital, request, req.query.limit);
        return res_.success(res, data);
    } catch (err) { next(err); }
};

// POST /api/request/:id/notify   body: { scope: 'top5' | 'top10' | 'all' }
const notifyDonors = async (req, res, next) => {
    try {
        const { scope } = req.body;
        if (!['top5', 'top10', 'all'].includes(scope)) {
            return res_.error(res, "scope must be one of 'top5', 'top10', 'all'", 400);
        }

        const hospital = await hospitalRepo.findByUserId(req.user.userId);
        if (!hospital) return res_.error(res, 'Hospital profile not found', 404);

        const request = await requestRepo.findById(parseInt(req.params.id));
        if (!request) return res_.error(res, 'Blood request not found', 404);
        if (request.hospital_id !== hospital.id) return res_.error(res, 'Access denied', 403);

        const data = await matchingSvc.notifyDonorsForRequest(hospital, request, scope);
        return res_.success(res, data, `Notified ${data.notified} donor(s)`);
    } catch (err) {
        if (err.message.includes('location is not set')) return res_.error(res, err.message, 400);
        next(err);
    }
};

module.exports = { getNearestForHospital, getNearestForRequest, notifyDonors };
