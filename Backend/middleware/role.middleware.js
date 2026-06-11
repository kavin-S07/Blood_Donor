const response = require('../utils/responseHandler');

const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) return response.error(res, 'Unauthorized', 401);
        if (!roles.includes(req.user.role)) {
            return response.error(res, 'Access denied: insufficient permissions', 403);
        }
        next();
    };
};

module.exports = authorizeRole;
