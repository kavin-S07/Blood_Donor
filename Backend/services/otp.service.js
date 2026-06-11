// services/otp.service.js
// In-memory OTP store: { email -> { otp, expiresAt } }
// NOTE: Resets on server restart. For production, replace with Redis or a DB table.

const otpStore = {};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Store an OTP for an email (10-minute expiry).
 * Returns the generated OTP string.
 */
const createOtp = (email) => {
    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 10 * 60 * 1000 };
    return otp;
};

/**
 * Verify an OTP.
 * Throws an Error with a descriptive message on failure.
 * Deletes the OTP from the store on success.
 */
const verifyOtp = (email, otp) => {
    const stored = otpStore[email];

    if (!stored) {
        throw new Error('OTP not found. Please request a new one.');
    }

    if (Date.now() > stored.expiresAt) {
        delete otpStore[email];
        throw new Error('OTP has expired. Please request a new one.');
    }

    if (String(stored.otp) !== String(otp)) {
        throw new Error('Invalid OTP. Please try again.');
    }

    // Valid — clean up
    delete otpStore[email];
};

module.exports = { createOtp, verifyOtp };
