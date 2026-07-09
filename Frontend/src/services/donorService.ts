
import { api } from './api';

export const donorService = {
  getDashboard: async () => {
    const { data } = await api.get('/donor/dashboard');
    return data.data;
  },
  getMatchingRequests: async () => {
    const { data } = await api.get('/donor/requests');
    return data.data;
  },
  acceptRequest: async (id: number) => {
    const { data } = await api.post(`/donor/request/${id}/accept`);
    return data;
  },
  rejectRequest: async (id: number) => {
    const { data } = await api.post(`/donor/request/${id}/reject`);
    return data;
  },
  updateAvailability: async (availability: boolean) => {
    const { data } = await api.put('/donor/availability', { availability });
    return data;
  },
  getDonationHistory: async () => {
    const { data } = await api.get('/donor/history');
    return data.data;
  },
  getActiveRequest: async () => {
    const { data } = await api.get('/donor/active-request');
    return data.data;
  },
};
