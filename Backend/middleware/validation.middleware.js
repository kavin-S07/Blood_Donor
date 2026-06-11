const { validationResult } = require('express-validator');
const response = require('../utils/responseHandler');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const formatted = errors.array().map(e => ({ field: e.path, message: e.msg }));
        return response.validationError(res, formatted);
    }
    next();
};

module.exports = validate;
