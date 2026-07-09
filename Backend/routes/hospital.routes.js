const express   = require('express');
const router    = express.Router();
const ctrl      = require('../controllers/hospital.controller');
const auth      = require('../middleware/auth.middleware');
const role      = require('../middleware/role.middleware');
const validate  = require('../middleware/validation.middleware');
const { createRequestValidator, updateRequestValidator } = require('../validators/hospital.validator');

router.use(auth, role('hospital'));

router.post('/request',                                     createRequestValidator, validate, ctrl.createRequest);
router.get('/requests',                                     ctrl.getRequests);
router.get('/request/:id',                                  ctrl.getRequestById);
router.put('/request/:id',                                  updateRequestValidator, validate, ctrl.updateRequest);
router.delete('/request/:id',                               ctrl.deleteRequest);
router.get('/request/:id/accepted-donors',                  ctrl.getAcceptedDonors);
router.post('/request/:id/response/:responseId/donated',    ctrl.markDonated);
router.post('/request/:id/response/:responseId/reject',     ctrl.rejectDonor);
router.get('/history',                                      ctrl.getDonationHistory);
router.get('/dashboard',                                    ctrl.getDashboard);
router.get('/dashboard/enhanced',                           ctrl.getEnhancedDashboard);
router.get('/analytics',                                    ctrl.getAnalytics);
router.get('/requests/filter',                              ctrl.getFilteredRequests);
router.get('/donors/filter',                                ctrl.getFilteredDonors);
router.get('/notifications',                                ctrl.getNotificationLogs);
router.post('/request/:id/notify-next',                     ctrl.notifyNextNearestDonor);
router.get('/request/:id/nearest-donors',                   ctrl.getNearestDonors);

module.exports = router;
