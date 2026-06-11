import { api } from './api';

export const profileService = {
  getProfile: async () => {
    const { data } = await api.get('/profile');
    return data.data;
  },
  updateProfile: async (payload: Partial<{
    name: string; phone: string; address: string; city: string; state: string;
  }>) => {
    const { data } = await api.put('/profile', payload);
    return data.data;
  },
  changePassword: async (current_password: string, new_password: string) => {
    const { data } = await api.put('/profile/change-password', { current_password, new_password });
    return data;
  },
};

export const notificationService = {
  // Backend returns { notifications: [...], unread_count: N } under data.data
  getAll: async () => {
    const { data } = await api.get('/notifications');
    const payload = data.data;
    // Normalise: accept both array and { notifications: [] } shape
    return Array.isArray(payload) ? payload : (payload?.notifications ?? []);
  },
  markRead: async (id: number) => {
    const { data } = await api.put(`/notifications/${id}/read`);
    return data;
  },
  markAllRead: async () => {
    const { data } = await api.put('/notifications/read-all');
    return data;
  },
  delete: async (id: number) => {
    const { data } = await api.delete(`/notifications/${id}`);
    return data;
  },
};
