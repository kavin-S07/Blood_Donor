const jwt       = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const response  = require('../utils/responseHandler');

const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return response.error(res, 'Access token required', 401);
        }

        const token   = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, jwtConfig.accessTokenSecret);
        req.user = decoded;
        next();
    } catch (err) {
        return response.error(res, 'Invalid or expired token', 401);
    }
};

module.exports = authenticateToken;
