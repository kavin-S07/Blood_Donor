const express     = require('express');
const router      = express.Router();
const ctrl        = require('../controllers/auth.controller');
const validate    = require('../middleware/validation.middleware');
const rateLimiter = require('../middleware/rateLimit.middleware');
const {
    signupValidator, loginValidator, forgotPasswordValidator,
    resetPasswordValidator,
} = require('../validators/auth.validator');

// Signup (no email verification step)
router.post('/signup', rateLimiter.auth, signupValidator, validate, ctrl.signup);

// Auth
router.post('/login',           rateLimiter.auth, loginValidator, validate, ctrl.login);
router.post('/refresh-token',   ctrl.refreshToken);

// Password reset
router.post('/forgot-password', rateLimiter.auth, forgotPasswordValidator, validate, ctrl.forgotPassword);
router.post('/verify-otp',      rateLimiter.auth, ctrl.verifyOtp);
router.post('/reset-password',  rateLimiter.auth, resetPasswordValidator,  validate, ctrl.resetPassword);

module.exports = router;
