import { api } from './api';
import type { LocationValue } from '../components/LocationPicker';

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';
const OSRM_ROUTE = 'https://router.project-osrm.org/route/v1/driving';

export const locationService = {
  getLocation: async (): Promise<LocationValue> => {
    const { data } = await api.get('/profile/location');
    return data.data;
  },
  updateLocation: async (location: LocationValue): Promise<LocationValue> => {
    const { data } = await api.put('/profile/location', location);
    return data.data;
  },
};

export const nominatimService = {
  search: async (query: string) => {
    const res = await fetch(
      `${NOMINATIM_SEARCH}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return res.json();
  },

  reverseGeocode: async (lat: number, lng: number) => {
    const res = await fetch(
      `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'en' } }
    );
    return res.json();
  },
};

export const osrmService = {
  getRoute: async (originLat: number, originLng: number, destLat: number, destLng: number) => {
    try {
      const res = await fetch(
        `${OSRM_ROUTE}/${originLng},${originLat};${destLng},${destLat}?overview=false`
      );
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes?.length) return null;
      const route = data.routes[0];
      return {
        distance_km: Math.round((route.distance / 1000) * 10) / 10,
        duration_min: Math.round((route.duration / 60) * 10) / 10,
      };
    } catch {
      return null;
    }
  },
};
