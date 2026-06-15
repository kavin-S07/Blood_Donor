import { api } from './api';

export const hospitalService = {
  getDashboard: async () => {
    const { data } = await api.get('/hospital/dashboard');
    return data.data;
  },
  getRequests: async () => {
    const { data } = await api.get('/hospital/requests');
    return data.data;
  },
  getRequestById: async (id: number) => {
    const { data } = await api.get(`/hospital/request/${id}`);
    return data.data;
  },
  createRequest: async (payload: {
    blood_group: string;
    units_needed: number;
    location: string;
    emergency_level: string;
    description?: string;
  }) => {
    const { data } = await api.post('/hospital/request', payload);
    return data;
  },
  updateRequest: async (id: number, payload: Partial<{
    blood_group: string;
    units_needed: number;
    location: string;
    emergency_level: string;
    description: string;
    status: string;
  }>) => {
    const { data } = await api.put(`/hospital/request/${id}`, payload);
    return data;
  },
  deleteRequest: async (id: number) => {
    const { data } = await api.delete(`/hospital/request/${id}`);
    return data;
  },
  getAcceptedDonors: async (id: number) => {
    const { data } = await api.get(`/hospital/request/${id}/accepted-donors`);
    return data.data;
  },
  markDonated: async (requestId: number, responseId: number) => {
    const { data } = await api.post(`/hospital/request/${requestId}/response/${responseId}/donated`);
    return data;
  },
  rejectDonor: async (requestId: number, responseId: number, reason: string) => {
    const { data } = await api.post(`/hospital/request/${requestId}/response/${responseId}/reject`, { reason });
    return data;
  },
  getDonationHistory: async () => {
    const { data } = await api.get('/hospital/history');
    return data.data;
  },
};
