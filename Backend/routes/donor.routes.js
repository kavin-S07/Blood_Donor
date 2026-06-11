const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/donor.controller');
const auth     = require('../middleware/auth.middleware');
const role     = require('../middleware/role.middleware');

router.use(auth, role('donor'));

router.get('/requests',               ctrl.getMatchingRequests);
router.post('/request/:id/accept',    ctrl.acceptRequest);
router.post('/request/:id/reject',    ctrl.rejectRequest);
router.put('/availability',           ctrl.updateAvailability);
router.get('/history',                ctrl.getDonationHistory);
router.get('/dashboard',              ctrl.getDashboard);

module.exports = router;
