import { api } from './api';

export interface AdminStats {
  total_donors: number;
  total_hospitals: number;
  pending_hospitals: number;
  approved_hospitals: number;
  rejected_hospitals: number;
  total_blood_requests: number;
  total_donations: number;
}

export interface PendingHospital {
  id: number;
  hospital_name: string;
  email: string;
  license_number: string;
  address: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: 'donor' | 'hospital' | 'admin';
  is_active: boolean;
  created_at: string;
}

export interface AdminBloodRequest {
  id: number;
  hospital_id: number;
  blood_group: string;
  units_needed: number;
  location: string;
  emergency_level: string;
  status: string;
  created_at: string;
}

export interface AdminDonation {
  id: number;
  donor_id: number;
  hospital_id: number;
  blood_group?: string;
  donation_date?: string;
  units_donated?: number;
  remarks?: string;
  created_at: string;
}

export const adminService = {
  // Dashboard
  getDashboardStats: async (): Promise<AdminStats> => {
    const { data } = await api.get('/admin/dashboard');
    return data.stats;
  },

  // Hospitals
  getAllHospitals: async () => {
    const { data } = await api.get('/admin/hospitals');
    return data.hospitals as PendingHospital[];
  },
  getPendingHospitals: async (): Promise<PendingHospital[]> => {
    const { data } = await api.get('/admin/hospitals/pending');
    return data.hospitals;
  },
  getApprovedHospitals: async (): Promise<PendingHospital[]> => {
    const { data } = await api.get('/admin/hospitals/approved');
    return data.hospitals;
  },
  getRejectedHospitals: async (): Promise<PendingHospital[]> => {
    const { data } = await api.get('/admin/hospitals/rejected');
    return data.hospitals;
  },
  approveHospital: async (id: number) => {
    const { data } = await api.post(`/admin/hospitals/${id}/approve`);
    return data;
  },
  rejectHospital: async (id: number, reason: string) => {
    const { data } = await api.post(`/admin/hospitals/${id}/reject`, { reason });
    return data;
  },

  // Users
  getAllUsers: async (): Promise<AdminUser[]> => {
    const { data } = await api.get('/admin/users');
    return data.users;
  },
  activateUser: async (id: number) => {
    const { data } = await api.patch(`/admin/users/${id}/activate`);
    return data;
  },
  deactivateUser: async (id: number) => {
    const { data } = await api.patch(`/admin/users/${id}/deactivate`);
    return data;
  },
  resetUserPassword: async (id: number): Promise<{ success: boolean; message: string; temp_password: string }> => {
    const { data } = await api.post(`/admin/users/${id}/reset-password`);
    return data;
  },

  // Monitoring
  getAllBloodRequests: async (): Promise<AdminBloodRequest[]> => {
    const { data } = await api.get('/admin/blood-requests');
    return data.requests;
  },
  getDonationHistory: async (): Promise<AdminDonation[]> => {
    const { data } = await api.get('/admin/donations');
    return data.donations;
  },
};