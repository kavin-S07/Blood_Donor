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

  verifyOtp: async (email: string, otp: string, namespace = 'reset') => {
    const { data } = await api.post('/auth/verify-otp', { email, otp, namespace });
    return data;
  },

  resetPassword: async (email: string, otp: string, new_password: string) => {
    const { data } = await api.post('/auth/reset-password', { email, otp, new_password });
    return data;
  },
};
