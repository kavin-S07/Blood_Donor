// routes/donorNearest.routes.js
// Exposes GET /api/donor/nearest for hospitals — kept in its own router
// (rather than donor.routes.js, which is donor-role-only) so it can be
// mounted ahead of the existing /api/donor router without touching it.

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/donorMatching.controller');
const auth    = require('../middleware/auth.middleware');
const role    = require('../middleware/role.middleware');

router.get('/nearest', auth, role('hospital'), ctrl.getNearestForHospital);

module.exports = router;
