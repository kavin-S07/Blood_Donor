const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/liveTracking.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

router.get('/:id/live-location', auth, role('hospital'), ctrl.getLiveLocation);
router.get('/:id/tracking', auth, role('hospital'), ctrl.getTracking);

module.exports = router;
