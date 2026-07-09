import { api } from './api';
import type { Notification } from '../types/donor';

interface NotificationsResponse {
  notifications: Notification[];
  unread_count: number;
}

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const { data } = await api.get('/notifications');
    const resp: NotificationsResponse = data.data;
    return resp.notifications;
  },
  getUnreadCount: async (): Promise<number> => {
    const { data } = await api.get('/notifications');
    const resp: NotificationsResponse = data.data;
    return resp.unread_count;
  },
  markRead: async (id: number) => {
    await api.put(`/notifications/${id}/read`);
  },
  markAllRead: async () => {
    await api.put('/notifications/read-all');
  },
};
