// validators/auth.validator.js

const { body } = require('express-validator');
const { BLOOD_GROUPS } = require('../utils/constants');

const signupValidator = [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
        .matches(/[0-9]/).withMessage('Password must contain a number'),
    body('phone')
        .matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit Indian phone number required'),
    body('city').trim().notEmpty().withMessage('City is required'),
    body('state').trim().notEmpty().withMessage('State is required'),

    // FIX: role now accepts 'donor' or 'hospital' at signup
    // (admin is created only via seeder, never via public signup)
    body('role').isIn(['donor', 'hospital']).withMessage('Role must be donor or hospital'),

    // ── Donor-specific fields ─────────────────────────────────
    body('blood_group')
        .if(body('role').equals('donor'))
        .isIn(BLOOD_GROUPS).withMessage('Valid blood group required'),
    body('age')
        .if(body('role').equals('donor'))
        .isInt({ min: 18, max: 65 }).withMessage('Donor age must be between 18 and 65'),
    body('gender')
        .if(body('role').equals('donor'))
        .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other'),

    // ── Hospital-specific fields ──────────────────────────────
    body('hospital_name')
        .if(body('role').equals('hospital'))
        .trim().notEmpty().withMessage('Hospital name is required'),
    body('license_number')
        .if(body('role').equals('hospital'))
        .trim().notEmpty().withMessage('License number is required'),
    body('hospital_address')
        .if(body('role').equals('hospital'))
        .trim().notEmpty().withMessage('Hospital address is required'),
    body('contact_number')
        .if(body('role').equals('hospital'))
        .trim().notEmpty().withMessage('Hospital contact number is required'),
];

const loginValidator = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidator = [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

module.exports = {
    signupValidator,
    loginValidator,
    changePasswordValidator,
};