export interface BloodRequest {
  id: number;
  hospital_id: number;
  blood_group: string;
  units_needed: number;
  location: string;
  emergency_level: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  created_at: string;
  hospital_name?: string;
  contact_number?: string;
}

export interface Donation {
  id: number;
  donor_id: number;
  hospital_id: number;
  blood_group?: string;
  donation_date?: string;
  units_donated?: number;
  remarks?: string;
  hospital_name?: string;
  donor_name?: string;
}

export interface DonorDashboard {
  total_donations: number;
  availability: boolean;
  blood_group: string;
  last_donation_date?: string;
  pending_responses?: number;
}

export interface HospitalDashboard {
  total_requests: number;
  active_requests: number;
  completed_requests: number;
  total_donors_notified?: number;
}

export interface AcceptedDonor {
  donor_id: number;
  name: string;
  phone: string;
  blood_group: string;
  city?: string;
  response_date: string;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const EMERGENCY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;