// controllers/admin.controller.js

const pendingHospitalRepo = require('../repositories/pendingHospital.repository');
const adminRepo           = require('../repositories/admin.repository');
const userRepo            = require('../repositories/user.repository');
const hospitalRepo        = require('../repositories/hospital.repository');
const db                  = require('../config/db');


// ── Dashboard Statistics ──────────────────────────────────────

const getDashboardStats = async (req, res) => {
    try {
        const stats = await adminRepo.getDashboardStats();
        res.status(200).json({ success: true, stats });
    } catch (error) {
        console.error('getDashboardStats:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard statistics' });
    }
};

// ── Pending Hospitals ─────────────────────────────────────────

const getPendingHospitals = async (req, res) => {
    try {
        const hospitals = await pendingHospitalRepo.findByStatus('pending');
        res.status(200).json({ success: true, count: hospitals.length, hospitals });
    } catch (error) {
        console.error('getPendingHospitals:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch pending hospitals' });
    }
};

const getApprovedHospitals = async (req, res) => {
    try {
        const hospitals = await pendingHospitalRepo.findByStatus('approved');
        res.status(200).json({ success: true, count: hospitals.length, hospitals });
    } catch (error) {
        console.error('getApprovedHospitals:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch approved hospitals' });
    }
};

const getRejectedHospitals = async (req, res) => {
    try {
        const hospitals = await pendingHospitalRepo.findByStatus('rejected');
        res.status(200).json({ success: true, count: hospitals.length, hospitals });
    } catch (error) {
        console.error('getRejectedHospitals:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rejected hospitals' });
    }
};

// ── All Active Hospitals (from hospitals + users join) ────────

const getAllHospitals = async (req, res) => {
    try {
        const hospitals = await adminRepo.getAllHospitals();
        res.status(200).json({ success: true, count: hospitals.length, hospitals });
    } catch (error) {
        console.error('getAllHospitals:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch hospitals' });
    }
};

const getHospitalById = async (req, res) => {
    try {
        const hospital = await adminRepo.getHospitalById(req.params.id);
        if (!hospital) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }
        res.status(200).json({ success: true, hospital });
    } catch (error) {
        console.error('getHospitalById:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch hospital' });
    }
};

// ── Approve Hospital ──────────────────────────────────────────

const approveHospital = async (req, res) => {
    const { id } = req.params;

    try {
        const pendingHospital = await pendingHospitalRepo.findById(id);

        if (!pendingHospital) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        if (pendingHospital.status === 'approved') {
            return res.status(400).json({ success: false, message: 'Hospital already approved' });
        }

        // Check if email already exists in users table (double-approval guard)
        const existingUser = await userRepo.findByEmail(pendingHospital.email);
        if (existingUser) {
            await pendingHospitalRepo.updateStatus(id, 'approved');
            return res.status(200).json({ success: true, message: 'Hospital approved (user already exists)' });
        }

        // 1. Create user account
        const user = await userRepo.create({
            name:     pendingHospital.hospital_name,
            email:    pendingHospital.email,
            password: pendingHospital.password_hash,   // already hashed
            phone:    pendingHospital.phone,
            role:     'hospital',
        });

        // 2. Create hospital profile
        await hospitalRepo.create({
            user_id:          user.id,
            hospital_name:    pendingHospital.hospital_name,
            license_number:   pendingHospital.license_number,
            hospital_address: pendingHospital.address,
            contact_number:   pendingHospital.phone,
            verified:         true,
        });

        // 3. Mark as approved in pending_hospitals
        await pendingHospitalRepo.updateStatus(id, 'approved');


        res.status(200).json({ success: true, message: 'Hospital approved successfully' });

    } catch (error) {
        console.error('approveHospital:', error);
        res.status(500).json({ success: false, message: 'Failed to approve hospital' });
    }
};

// ── Reject Hospital ───────────────────────────────────────────

const rejectHospital = async (req, res) => {
    const { id }     = req.params;
    const { reason } = req.body;

    try {
        const pendingHospital = await pendingHospitalRepo.findById(id);

        if (!pendingHospital) {
            return res.status(404).json({ success: false, message: 'Hospital not found' });
        }

        if (pendingHospital.status === 'rejected') {
            return res.status(400).json({ success: false, message: 'Hospital already rejected' });
        }

        await pendingHospitalRepo.reject(id, reason || 'Not specified');


        res.status(200).json({ success: true, message: 'Hospital rejected successfully' });

    } catch (error) {
        console.error('rejectHospital:', error);
        res.status(500).json({ success: false, message: 'Failed to reject hospital' });
    }
};

// ── User Management ───────────────────────────────────────────

const getAllUsers = async (req, res) => {
    try {
        const users = await adminRepo.getAllUsers();
        res.status(200).json({ success: true, count: users.length, users });
    } catch (error) {
        console.error('getAllUsers:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

const activateUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await adminRepo.activateUser(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, message: 'User activated' });
    } catch (error) {
        console.error('activateUser:', error);
        res.status(500).json({ success: false, message: 'Failed to activate user' });
    }
};

const deactivateUser = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await adminRepo.deactivateUser(id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        res.status(200).json({ success: true, message: 'User deactivated' });
    } catch (error) {
        console.error('deactivateUser:', error);
        res.status(500).json({ success: false, message: 'Failed to deactivate user' });
    }
};

// ── Blood Request Monitoring ──────────────────────────────────

const getAllBloodRequests = async (req, res) => {
    try {
        const requests = await adminRepo.getAllBloodRequests();
        res.status(200).json({ success: true, count: requests.length, requests });
    } catch (error) {
        console.error('getAllBloodRequests:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch blood requests' });
    }
};

const getDonationHistory = async (req, res) => {
    try {
        const donations = await adminRepo.getDonationHistory();
        res.status(200).json({ success: true, count: donations.length, donations });
    } catch (error) {
        console.error('getDonationHistory:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch donation history' });
    }
};

module.exports = {
    getDashboardStats,

    getPendingHospitals,
    getApprovedHospitals,
    getRejectedHospitals,
    getAllHospitals,
    getHospitalById,

    approveHospital,
    rejectHospital,

    getAllUsers,
    activateUser,
    deactivateUser,

    getAllBloodRequests,
    getDonationHistory,
};
