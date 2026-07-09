// services/auth.service.js

const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const userRepo    = require('../repositories/user.repository');
const donorRepo   = require('../repositories/donor.repository');
const hospitalRepo = require('../repositories/hospital.repository');

// FIX: pendingHospitalRepo was used in login() but never imported
const pendingHospitalRepo = require('../repositories/pendingHospital.repository');

const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const jwtConfig = require('../config/jwt');

// ── Signup ────────────────────────────────────────────────────

/**
 * Donors are created immediately.
 * Hospitals are placed in pending_hospitals for admin review — NOT in users table yet.
 */
const signup = async (data) => {
    // Check users table
    const existingUser = await userRepo.findByEmail(data.email);
    if (existingUser) throw new Error('Email already registered');

    // Also check pending_hospitals to prevent duplicate registrations
    const existingPending = await pendingHospitalRepo.findByEmail(data.email);
    if (existingPending) throw new Error('Email already registered');

    if (data.role === 'donor') {
        // Donors: create account immediately
        const hashed = await bcrypt.hash(data.password, 12);
        const user   = await userRepo.create({
            ...data,
            password: hashed,
            latitude:          data.latitude ?? null,
            longitude:         data.longitude ?? null,
            formatted_address: data.formatted_address || null,
        });

        await donorRepo.create({
            user_id:            user.id,
            blood_group:        data.blood_group,
            age:                data.age,
            gender:             data.gender,
            availability:       true,
            last_donation_date: data.last_donation_date || null,
            total_donations:    0,
        });

        const { password: _, ...safeUser } = user;
        return { user: safeUser, requiresApproval: false };

    } else if (data.role === 'hospital') {
        // Hospitals: store in pending_hospitals for admin approval
        const hashed = await bcrypt.hash(data.password, 12);

        await pendingHospitalRepo.create({
            hospital_name:  data.hospital_name  || data.name,
            email:          data.email,
            password_hash:  hashed,
            license_number: data.license_number,
            address:        data.hospital_address,
            phone:          data.contact_number  || data.phone,
            latitude:          data.latitude ?? null,
            longitude:         data.longitude ?? null,
            formatted_address: data.formatted_address || null,
        });

        return {
            requiresApproval: true,
            message: 'Hospital registration submitted. Awaiting admin approval.',
        };

    } else {
        throw new Error('Invalid role');
    }
};

// ── Login ─────────────────────────────────────────────────────

const login = async (email, password) => {

    // FIX: Check pending_hospitals BEFORE checking the users table so we can
    //      return the correct error message for hospitals awaiting/rejected approval.
    const pendingHospital = await pendingHospitalRepo.findByEmail(email);

    if (pendingHospital && pendingHospital.status === 'pending') {
        throw new Error('Hospital registration is pending admin approval');
    }

    if (pendingHospital && pendingHospital.status === 'rejected') {
        const reason = pendingHospital.rejection_reason
            ? ` Reason: ${pendingHospital.rejection_reason}`
            : '';
        throw new Error(`Hospital registration was rejected.${reason}`);
    }

    const user = await userRepo.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');

    // Block inactive accounts
    if (user.is_active === false) {
        throw new Error('Your account has been deactivated. Please contact support.');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid email or password');

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const { password: _, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
};

// ── Refresh token ─────────────────────────────────────────────

const refreshAccessToken = async (token) => {
    if (!token) throw new Error('Refresh token required');

    let decoded;
    try {
        decoded = jwt.verify(token, jwtConfig.refreshTokenSecret);
    } catch {
        throw new Error('Invalid or expired refresh token');
    }

    const user = await userRepo.findById(decoded.userId);
    if (!user) throw new Error('User not found');

    return { accessToken: generateAccessToken(user) };
};

// ── Change Password ───────────────────────────────────────────

const changePassword = async (userId, currentPassword, newPassword) => {
    const user  = await userRepo.findById(userId);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await userRepo.updatePassword(userId, hashed);
};

module.exports = {
    signup,
    login,
    refreshAccessToken,
    changePassword,
};