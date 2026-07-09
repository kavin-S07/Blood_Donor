// services/admin.service.js

const pendingHospitalRepo = require('../repositories/pendingHospital.repository');
const userRepo = require('../repositories/user.repository');
const hospitalRepo = require('../repositories/hospital.repository');

class AdminService {

    async getPendingHospitals() {
        return await pendingHospitalRepo.findByStatus('pending');
    }

    async getApprovedHospitals() {
        return await pendingHospitalRepo.findByStatus('approved');
    }

    async getRejectedHospitals() {
        return await pendingHospitalRepo.findByStatus('rejected');
    }

    async approveHospital(id) {

        const hospital =
            await pendingHospitalRepo.findById(id);

        if (!hospital) {
            throw new Error('Hospital not found');
        }

        if (hospital.status === 'approved') {
            throw new Error('Hospital already approved');
        }

        const user = await userRepo.create({
            name: hospital.hospital_name,
            email: hospital.email,
            password: hospital.password_hash,
            phone: hospital.phone,
            role: 'hospital',
            latitude: hospital.latitude,
            longitude: hospital.longitude,
            formatted_address: hospital.formatted_address,
        });

        await hospitalRepo.create({
            user_id: user.id,
            hospital_name: hospital.hospital_name,
            license_number: hospital.license_number,
            hospital_address: hospital.address,
            contact_number: hospital.phone,
            verified: true,
            latitude: hospital.latitude,
            longitude: hospital.longitude,
            formatted_address: hospital.formatted_address,
        });

        await pendingHospitalRepo.approve(id);

        return {
            success: true,
            hospital
        };
    }

    async rejectHospital(id, reason) {

        const hospital =
            await pendingHospitalRepo.findById(id);

        if (!hospital) {
            throw new Error('Hospital not found');
        }

        await pendingHospitalRepo.reject(
            id,
            reason || 'No reason provided'
        );

        return {
            success: true,
            hospital
        };
    }
}

module.exports = new AdminService();