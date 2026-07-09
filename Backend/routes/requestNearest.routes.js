// routes/requestNearest.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/donorMatching.controller');
const auth    = require('../middleware/auth.middleware');
const role    = require('../middleware/role.middleware');

router.get('/:id/nearest', auth, role('hospital'), ctrl.getNearestForRequest);
router.post('/:id/notify', auth, role('hospital'), ctrl.notifyDonors);

module.exports = router;
