// routes/navigation.routes.js
// Donor Navigation feature — additive, does not touch requestNearest.routes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/navigation.controller');
const auth    = require('../middleware/auth.middleware');
const role    = require('../middleware/role.middleware');

router.get('/:id/route', auth, role('donor'), ctrl.getRequestRoute);

module.exports = router;