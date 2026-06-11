require('dotenv').config();

module.exports = {
    accessTokenSecret:  process.env.JWT_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    accessTokenExpiry:  process.env.JWT_EXPIRES_IN         || '15m',
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
};
