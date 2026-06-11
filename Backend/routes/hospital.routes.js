const express   = require('express');
const router    = express.Router();
const ctrl      = require('../controllers/hospital.controller');
const auth      = require('../middleware/auth.middleware');
const role      = require('../middleware/role.middleware');
const validate  = require('../middleware/validation.middleware');
const { createRequestValidator, updateRequestValidator } = require('../validators/hospital.validator');

router.use(auth, role('hospital'));

router.post('/request',                     createRequestValidator, validate, ctrl.createRequest);
router.get('/requests',                     ctrl.getRequests);
router.get('/request/:id',                  ctrl.getRequestById);
router.put('/request/:id',                  updateRequestValidator, validate, ctrl.updateRequest);
router.delete('/request/:id',               ctrl.deleteRequest);
router.get('/request/:id/accepted-donors',  ctrl.getAcceptedDonors);
router.get('/history',                      ctrl.getDonationHistory);
router.get('/dashboard',                    ctrl.getDashboard);

module.exports = router;
