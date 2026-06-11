const authService  = require('../services/auth.service');
const res_         = require('../utils/responseHandler');

const signup = async (req, res, next) => {
    try {
        const user = await authService.signup(req.body);
        return res_.created(res, user, 'Account created successfully');
    } catch (err) {
        if (err.message === 'Email already registered') {
            return res_.error(res, err.message, 409);
        }
        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        return res_.success(res, result, 'Login successful');
    } catch (err) {
        if (err.message === 'Invalid email or password') {
            return res_.error(res, err.message, 401);
        }
        next(err);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const result = await authService.refreshAccessToken(refreshToken);
        return res_.success(res, result, 'Access token refreshed');
    } catch (err) {
        return res_.error(res, err.message, 401);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        await authService.forgotPassword(email);
        // Always return success to prevent email enumeration
        return res_.success(res, {}, 'If that email exists, you can now reset your password');
    } catch (err) {
        return res_.success(res, {}, 'If that email exists, you can now reset your password');
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const { email, new_password } = req.body;
        await authService.resetPassword(email, new_password);
        return res_.success(res, {}, 'Password reset successfully');
    } catch (err) {
        return res_.error(res, err.message, 400);
    }
};

module.exports = {
    signup, login, refreshToken,
    forgotPassword, resetPassword,
};
