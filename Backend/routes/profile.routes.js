const express  = require('express');
const router   = express.Router();
const ctrl     = require('../controllers/profile.controller');
const auth     = require('../middleware/auth.middleware');
const validate = require('../middleware/validation.middleware');
const { updateProfileValidator } = require('../validators/profile.validator');
const { changePasswordValidator } = require('../validators/auth.validator');
const { requiredLocationValidator } = require('../validators/location.validator');

router.use(auth);

router.get('/',                                  ctrl.getProfile);
router.put('/',    updateProfileValidator,       validate, ctrl.updateProfile);
router.put('/change-password', changePasswordValidator, validate, ctrl.changePassword);

// ── Location (Google Maps based location selection) ───────────
router.get('/location',                                        ctrl.getLocation);
router.put('/location', requiredLocationValidator, validate,    ctrl.updateLocation);

module.exports = router;
