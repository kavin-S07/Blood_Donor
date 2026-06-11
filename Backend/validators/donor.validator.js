const { body } = require('express-validator');
const { BLOOD_GROUPS } = require('../utils/constants');

const updateDonorValidator = [
    body('blood_group').optional().isIn(BLOOD_GROUPS).withMessage('Valid blood group required'),
    body('age').optional().isInt({ min: 18, max: 65 }).withMessage('Age must be between 18 and 65'),
    body('gender').optional().isIn(['male', 'female', 'other']),
    body('availability').optional().isBoolean(),
];

module.exports = { updateDonorValidator };
