// validators/location.validator.js
//
// Reusable express-validator chains for latitude / longitude / formatted_address.
// Used by: auth.validator (signup), profile.validator (location update).

const { body } = require('express-validator');

// Required location fields (used when the client MUST supply a location,
// e.g. saving a location via PUT /api/profile/location)
const requiredLocationValidator = [
    body('latitude')
        .notEmpty().withMessage('Latitude is required')
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
        .notEmpty().withMessage('Longitude is required')
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('formatted_address')
        .trim().notEmpty().withMessage('Formatted address is required')
        .isLength({ max: 500 }).withMessage('Formatted address is too long'),
];

// Optional location fields (used at signup — location is a nice-to-have,
// not required, so existing signup behaviour without a map pick still works)
const optionalLocationValidator = [
    body('latitude')
        .optional({ nullable: true })
        .isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude')
        .optional({ nullable: true })
        .isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('formatted_address')
        .optional({ nullable: true })
        .trim().isLength({ max: 500 }).withMessage('Formatted address is too long'),
];

module.exports = { requiredLocationValidator, optionalLocationValidator };
