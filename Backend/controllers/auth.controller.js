// controllers/auth.controller.js

const authService = require('../services/auth.service');
const res_        = require('../utils/responseHandler');

// ── Signup ────────────────────────────────────────────────────

const signup = async (req, res, next) => {
    try {
        const result = await authService.signup(req.body);

        // FIX: hospital signups return requiresApproval flag — respond with 202
        if (result.requiresApproval) {
            return res.status(202).json({
                success: true,
                requiresApproval: true,
                message: result.message,
            });
        }

        return res_.created(res, result.user, 'Account created successfully');
    } catch (err) {
        if (err.message === 'Email already registered') {
            return res_.error(res, err.message, 409);
        }
        next(err);
    }
};

// ── Login ─────────────────────────────────────────────────────

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        return res_.success(res, result, 'Login successful');
    } catch (err) {
        // FIX: propagate hospital-specific errors with appropriate status codes
        if (err.message === 'Invalid email or password') {
            return res_.error(res, err.message, 401);
        }
        if (err.message.startsWith('Hospital registration is pending')) {
            return res_.error(res, err.message, 403);
        }
        if (err.message.startsWith('Hospital registration was rejected')) {
            return res_.error(res, err.message, 403);
        }
        if (err.message.startsWith('Your account has been deactivated')) {
            return res_.error(res, err.message, 403);
        }
        next(err);
    }
};

// ── Refresh Token ─────────────────────────────────────────────

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshAccessToken(refreshToken);
        return res_.success(res, result, 'Access token refreshed');
    } catch (err) {
        return res_.error(res, err.message, 401);
    }
};

// ── Forgot Password (Step 1 — send OTP) ──────────────────────

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);
        return res_.success(res, {}, 'OTP sent to your email address');
    } catch {
        // Generic response to prevent email enumeration
        return res_.success(res, {}, 'If that email exists, an OTP has been sent');
    }
};

module.exports = {
    signup,
    login,
    refreshToken,
    forgotPassword,
};
