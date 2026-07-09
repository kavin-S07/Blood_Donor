const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const OTP_EXPIRY_MINUTES = 10;

const getOTPExpiry = () => {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + OTP_EXPIRY_MINUTES);
    return expiry;
};

module.exports = { generateOTP, getOTPExpiry, OTP_EXPIRY_MINUTES };
