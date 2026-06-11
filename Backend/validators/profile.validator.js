const { body } = require('express-validator');

const updateProfileValidator = [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('phone')
        .optional()
        .matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number required'),
    body('city').optional().trim(),
    body('state').optional().trim(),
    body('address').optional().trim(),
];

module.exports = { updateProfileValidator };
