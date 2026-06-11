const jwt    = require('jsonwebtoken');
const config = require('../config/jwt');

const generateAccessToken = (user) => {
    return jwt.sign(
        { userId: user.id, role: user.role },
        config.accessTokenSecret,
        { expiresIn: config.accessTokenExpiry }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { userId: user.id },
        config.refreshTokenSecret,
        { expiresIn: config.refreshTokenExpiry }
    );
};

module.exports = { generateAccessToken, generateRefreshToken };
