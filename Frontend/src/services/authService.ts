import { api } from './api';
import type { LoginResponse, SignupDonorData, SignupHospitalData } from '../types/auth';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const { data } = await api.post('/auth/login', { email, password });
    return data.data;
  },

  signup: async (payload: SignupDonorData | SignupHospitalData) => {
    const { data } = await api.post('/auth/signup', payload);
    return data.data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data;
  },

  resetPassword: async (email: string, new_password: string) => {
    const { data } = await api.post('/auth/reset-password', { email, new_password });
    return data;
  },
};
