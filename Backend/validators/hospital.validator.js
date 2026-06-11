const { body } = require('express-validator');
const { BLOOD_GROUPS, EMERGENCY_LEVELS } = require('../utils/constants');

const createRequestValidator = [
    body('blood_group').isIn(BLOOD_GROUPS).withMessage('Valid blood group required'),
    body('units_needed').isInt({ min: 1 }).withMessage('Units needed must be a positive integer'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('emergency_level').isIn(EMERGENCY_LEVELS).withMessage('Emergency level must be low, medium, high, or critical'),
    body('description').optional().trim(),
];

const updateRequestValidator = [
    body('blood_group').optional().isIn(BLOOD_GROUPS).withMessage('Valid blood group required'),
    body('units_needed').optional().isInt({ min: 1 }).withMessage('Units needed must be a positive integer'),
    body('location').optional().trim().notEmpty(),
    body('emergency_level').optional().isIn(EMERGENCY_LEVELS),
    body('status').optional().isIn(['pending', 'accepted', 'completed', 'cancelled']),
];

module.exports = { createRequestValidator, updateRequestValidator };
