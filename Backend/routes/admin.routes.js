// routes/admin.routes.js

const express = require('express');
const router  = express.Router();

const adminController = require('../controllers/admin.controller');
const authenticate    = require('../middleware/auth.middleware');

// FIX: was importing from '../middleware/authorizeRole' which does not exist.
// The actual file is role.middleware.js
const authorizeRole   = require('../middleware/role.middleware');

/*
|--------------------------------------------------------------------------
| Dashboard Statistics
|--------------------------------------------------------------------------
*/
router.get(
    '/dashboard',
    authenticate,
    authorizeRole('admin'),
    adminController.getDashboardStats
);

/*
|--------------------------------------------------------------------------
| Hospital Management
|--------------------------------------------------------------------------
*/
router.get(
    '/hospitals',
    authenticate,
    authorizeRole('admin'),
    adminController.getAllHospitals
);

router.get(
    '/hospitals/pending',
    authenticate,
    authorizeRole('admin'),
    adminController.getPendingHospitals
);

router.get(
    '/hospitals/approved',
    authenticate,
    authorizeRole('admin'),
    adminController.getApprovedHospitals
);

router.get(
    '/hospitals/rejected',
    authenticate,
    authorizeRole('admin'),
    adminController.getRejectedHospitals
);

router.get(
    '/hospitals/:id',
    authenticate,
    authorizeRole('admin'),
    adminController.getHospitalById
);

router.post(
    '/hospitals/:id/approve',
    authenticate,
    authorizeRole('admin'),
    adminController.approveHospital
);

router.post(
    '/hospitals/:id/reject',
    authenticate,
    authorizeRole('admin'),
    adminController.rejectHospital
);

/*
|--------------------------------------------------------------------------
| User Management
|--------------------------------------------------------------------------
*/
router.get(
    '/users',
    authenticate,
    authorizeRole('admin'),
    adminController.getAllUsers
);

router.patch(
    '/users/:id/activate',
    authenticate,
    authorizeRole('admin'),
    adminController.activateUser
);

router.patch(
    '/users/:id/deactivate',
    authenticate,
    authorizeRole('admin'),
    adminController.deactivateUser
);

// FIX: route was missing even though the frontend (AdminUserManagementPage)
// and services/adminService.ts already call it, and auth.routes.js documents
// it as the supported admin-assisted password reset flow.
router.post(
    '/users/:id/reset-password',
    authenticate,
    authorizeRole('admin'),
    adminController.resetUserPassword
);

/*
|--------------------------------------------------------------------------
| Blood Requests & Donations (monitoring)
|--------------------------------------------------------------------------
*/
router.get(
    '/blood-requests',
    authenticate,
    authorizeRole('admin'),
    adminController.getAllBloodRequests
);

router.get(
    '/donations',
    authenticate,
    authorizeRole('admin'),
    adminController.getDonationHistory
);

module.exports = router;