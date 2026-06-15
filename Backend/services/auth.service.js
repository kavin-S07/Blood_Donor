const bcrypt       = require('bcryptjs');
const jwt          = require('jsonwebtoken');
const userRepo     = require('../repositories/user.repository');
const donorRepo    = require('../repositories/donor.repository');
const hospitalRepo = require('../repositories/hospital.repository');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateTokens');
const jwtConfig    = require('../config/jwt');
const otpStore     = require('../utils/otpStore');

// ── Signup ────────────────────────────────────────────────────

/**
 * Creates the account directly — no email/OTP verification step.
 */
const signup = async (data) => {
    const existing = await userRepo.findByEmail(data.email);
    if (existing) throw new Error('Email already registered');

    const hashed = await bcrypt.hash(data.password, 12);
    const user   = await userRepo.create({ ...data, password: hashed });

    if (user.role === 'donor') {
        await donorRepo.create({
            user_id:            user.id,
            blood_group:        data.blood_group,
            age:                data.age,
            gender:             data.gender,
            availability:       true,
            last_donation_date: data.last_donation_date || null,
            total_donations:    0,
        });
    } else {
        await hospitalRepo.create({
            user_id:          user.id,
            hospital_name:    data.hospital_name,
            license_number:   data.license_number,
            hospital_address: data.hospital_address,
            contact_number:   data.contact_number,
        });
    }

    const { password: _, otp: __, ...safeUser } = user;
    return safeUser;
};

// ── Auth ──────────────────────────────────────────────────────

const login = async (email, password) => {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid email or password');

    const accessToken  = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const { password: _, ...safeUser } = user;
    return { accessToken, refreshToken, user: safeUser };
};

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

// ── Password Reset OTP ────────────────────────────────────────

const forgotPassword = async (email) => {
    const user = await userRepo.findByEmail(email);
    if (!user) throw new Error('No account found with that email');

    const otp = otpStore.generate();
    otpStore.set('reset', email, otp);

    // Email sending removed (no provider configured).
    // OTP is logged here so it can still be retrieved for testing.
    console.log(`[Password Reset OTP] ${email} -> ${otp}`);

    return user;
};

const verifyOtp = (namespace, email, otp) => {
    const valid = otpStore.verify(namespace, email, otp);
    if (!valid) throw new Error('Invalid or expired OTP');
};

const resetPassword = async (email, otp, newPassword) => {
    const valid = otpStore.verify('reset', email, otp);
    if (!valid) throw new Error('Invalid or expired OTP');

    const user = await userRepo.findByEmail(email);
    if (!user) throw new Error('User not found');

    const hashed = await bcrypt.hash(newPassword, 12);
    await userRepo.updatePassword(user.id, hashed);
    otpStore.consume('reset', email);
};

const changePassword = async (userId, currentPassword, newPassword) => {
    const user  = await userRepo.findById(userId);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new Error('Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, 12);
    await userRepo.updatePassword(userId, hashed);
};

module.exports = {
    signup,
    login, refreshAccessToken,
    forgotPassword, verifyOtp, resetPassword, changePassword,
};
