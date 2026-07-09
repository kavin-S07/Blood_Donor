import { api } from './api';
import type { NavigationRoute } from '../types/donor';
import type { TrackingData, LiveLocationRecord } from '../types/liveTracking';

export const navigationService = {
  getRequestRoute: async (
    requestId: number,
    donorLat: number,
    donorLng: number
  ): Promise<NavigationRoute> => {
    const { data } = await api.get(`/request/${requestId}/route`, {
      params: { donorLat, donorLng },
    });
    return data.data;
  },

  getLiveLocation: async (requestId: number): Promise<LiveLocationRecord> => {
    const { data } = await api.get(`/request/${requestId}/live-location`);
    return data.data;
  },

  getTrackingInfo: async (requestId: number): Promise<TrackingData> => {
    const { data } = await api.get(`/request/${requestId}/tracking`);
    return data.data;
  },
};
