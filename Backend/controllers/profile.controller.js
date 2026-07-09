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

// ── Location ──────────────────────────────────────────────────
// GET /api/profile/location
const getLocation = async (req, res, next) => {
    try {
        const user = await userRepo.findById(req.user.userId);
        if (!user) return res_.error(res, 'User not found', 404);

        return res_.success(res, {
            latitude:          user.latitude !== null && user.latitude !== undefined ? Number(user.latitude) : null,
            longitude:         user.longitude !== null && user.longitude !== undefined ? Number(user.longitude) : null,
            formatted_address: user.formatted_address || null,
        });
    } catch (err) { next(err); }
};

// PUT /api/profile/location
const updateLocation = async (req, res, next) => {
    try {
        const { latitude, longitude, formatted_address } = req.body;

        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);

        if (Number.isNaN(lat) || lat < -90 || lat > 90) {
            return res_.error(res, 'Invalid latitude', 400);
        }
        if (Number.isNaN(lng) || lng < -180 || lng > 180) {
            return res_.error(res, 'Invalid longitude', 400);
        }
        if (!formatted_address || !formatted_address.trim()) {
            return res_.error(res, 'Formatted address is required', 400);
        }

        const locationFields = { latitude: lat, longitude: lng, formatted_address: formatted_address.trim() };

        const user = await userRepo.update(req.user.userId, locationFields);
        if (!user) return res_.error(res, 'User not found', 404);

        // Keep the hospitals table (source of truth for hospital location
        // elsewhere in the app) in sync when a hospital updates its location.
        if (user.role === 'hospital') {
            const hospital = await hospitalRepo.findByUserId(user.id);
            if (hospital) {
                await hospitalRepo.update(hospital.id, locationFields);
            }
        }

        return res_.success(res, {
            latitude:          Number(user.latitude),
            longitude:         Number(user.longitude),
            formatted_address: user.formatted_address,
        }, 'Location updated successfully');
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

module.exports = { getProfile, updateProfile, changePassword, getLocation, updateLocation };
