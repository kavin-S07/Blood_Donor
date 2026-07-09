import { api } from './api';
import type { NearestDonorsResult, NotifyDonorsResult, NotifyScope } from '../types/donor';
import type { EnhancedDashboard, Analytics, FilterParams, NotificationLog, NotifyNextResult } from '../types/analytics';

export const hospitalService = {
  getDashboard: async () => {
    const { data } = await api.get('/hospital/dashboard');
    return data.data;
  },
  getEnhancedDashboard: async (): Promise<EnhancedDashboard> => {
    const { data } = await api.get('/hospital/dashboard/enhanced');
    return data.data;
  },
  getAnalytics: async (): Promise<Analytics> => {
    const { data } = await api.get('/hospital/analytics');
    return data.data;
  },
  getFilteredRequests: async (filters: FilterParams) => {
    const { data } = await api.get('/hospital/requests/filter', { params: filters });
    return data.data;
  },
  getFilteredDonors: async (filters: FilterParams) => {
    const { data } = await api.get('/hospital/donors/filter', { params: filters });
    return data.data;
  },
  getNotificationLogs: async (limit = 50): Promise<NotificationLog[]> => {
    const { data } = await api.get('/hospital/notifications', { params: { limit } });
    return data.data;
  },
  notifyNextNearestDonor: async (requestId: number): Promise<NotifyNextResult> => {
    const { data } = await api.post(`/hospital/request/${requestId}/notify-next`);
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
    pickup_latitude?: number;
    pickup_longitude?: number;
  }) => {
    const { data } = await api.post('/hospital/request', payload);
    return data;
  },
  getNearestDonors: async (id: number) => {
    const { data } = await api.get(`/hospital/request/${id}/nearest-donors`);
    return data.data;
  },
  // Smart Nearest Donor Matching — nearest eligible donors for the logged-in hospital overall
  getNearestDonorsOverview: async (limit = 5): Promise<NearestDonorsResult> => {
    const { data } = await api.get(`/donor/nearest`, { params: { limit } });
    return data.data;
  },
  // Smart Nearest Donor Matching — nearest eligible donors for a specific blood request
  getNearestDonorsForRequest: async (requestId: number, limit = 5): Promise<NearestDonorsResult> => {
    const { data } = await api.get(`/request/${requestId}/nearest`, { params: { limit } });
    return data.data;
  },
  // Notify top 5 / top 10 / all compatible donors for a request
  notifyDonors: async (requestId: number, scope: NotifyScope): Promise<NotifyDonorsResult> => {
    const { data } = await api.post(`/request/${requestId}/notify`, { scope });
    return data.data;
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
