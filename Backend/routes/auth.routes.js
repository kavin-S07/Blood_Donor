const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/auth.controller');
const validate    = require('../middleware/validation.middleware');
const rateLimiter = require('../middleware/rateLimit.middleware');
const {
    signupValidator, loginValidator,
} = require('../validators/auth.validator');

// Signup (no email verification step)
router.post('/signup', rateLimiter.auth, signupValidator, validate, ctrl.signup);

// Auth
router.post('/login',           rateLimiter.auth, loginValidator, validate, ctrl.login);
router.post('/refresh-token',   ctrl.refreshToken);

// NOTE: Password reset is handled in-app via:
//   - PUT  /api/profile/change-password         (user knows current password)
//   - POST /api/admin/users/:id/reset-password  (admin-assisted reset for locked-out users)
// The previous email/OTP based forgot-password flow has been removed.

module.exports = router;