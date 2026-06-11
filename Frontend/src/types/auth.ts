export type Role = 'donor' | 'hospital';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  role: Role;
  created_at: string;
}

export interface DonorProfile {
  id: number;
  user_id: number;
  blood_group: string;
  age: number;
  gender?: string;
  availability: boolean;
  last_donation_date?: string;
  total_donations: number;
}

export interface HospitalProfile {
  id: number;
  user_id: number;
  hospital_name: string;
  license_number: string;
  hospital_address: string;
  contact_number: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: User;
}

export interface SignupDonorData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  role: 'donor';
  blood_group: string;
  age: number;
  gender?: string;
  last_donation_date?: string;
}

export interface SignupHospitalData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  role: 'hospital';
  hospital_name: string;
  license_number: string;
  hospital_address: string;
  contact_number: string;
}