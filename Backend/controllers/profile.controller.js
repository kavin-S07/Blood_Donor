const userRepo     = require('../repositories/user.repository');
const donorRepo    = require('../repositories/donor.repository');
const hospitalRepo = require('../repositories/hospital.repository');
const authService  = require('../services/auth.service');
const res_         = require('../utils/responseHandler');

const getProfile = async (req, res, next) => {
    try {
        const user = await userRepo.findById(req.user.userId);
        if (!user) return res_.error(res, 'User not found', 404);

        const { password: _, ...safeUser } = user;

        let roleProfile = null;
        if (user.role === 'donor') {
            roleProfile = await donorRepo.findByUserId(user.id);
        } else {
            roleProfile = await hospitalRepo.findByUserId(user.id);
        }

        return res_.success(res, { ...safeUser, profile: roleProfile });
    } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
    try {
        const allowed = ['name', 'phone', 'address', 'city', 'state'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        if (!Object.keys(updates).length) {
            return res_.error(res, 'No valid fields to update', 400);
        }

        const user = await userRepo.update(req.user.userId, updates);
        const { password: _, ...safeUser } = user;
        return res_.success(res, safeUser, 'Profile updated');
    } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;
        await authService.changePassword(req.user.userId, current_password, new_password);
        return res_.success(res, {}, 'Password changed successfully');
    } catch (err) {
        if (err.message === 'Current password is incorrect') {
            return res_.error(res, err.message, 400);
        }
        next(err);
    }
};

module.exports = { getProfile, updateProfile, changePassword };
