const donorService    = require('../services/donor.service');
const hospitalService = require('../services/hospital.service');
const res_            = require('../utils/responseHandler');

const getDashboard = async (req, res, next) => {
    try {
        let data;
        if (req.user.role === 'donor') {
            data = await donorService.getDashboard(req.user.userId);
        } else {
            data = await hospitalService.getDashboard(req.user.userId);
        }
        return res_.success(res, data);
    } catch (err) { next(err); }
};

module.exports = { getDashboard };
