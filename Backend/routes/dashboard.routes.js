const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/dashboard.controller');
const auth    = require('../middleware/auth.middleware');

router.use(auth);
router.get('/', ctrl.getDashboard);

module.exports = router;
