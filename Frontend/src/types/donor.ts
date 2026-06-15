export interface BloodRequest {
  id: number;
  hospital_id: number;
  blood_group: string;
  units_needed: number;
  units_received?: number;
  location: string;
  emergency_level: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  status: 'pending' | 'accepted' | 'completed' | 'partially_completed' | 'cancelled';
  created_at: string;
  hospital_name?: string;
  contact_number?: string;
  accepted_count?: number;
  donated_count?: number;
}

export interface Donation {
  id: number;
  donor_id: number;
  hospital_id: number;
  request_id?: number;
  blood_group?: string;
  donation_date?: string;
  units_donated?: number;
  remarks?: string;
  status?: string;
  hospital_name?: string;
  donor_name?: string;
}

export interface DonorDashboard {
  total_donations: number;
  availability: boolean;
  blood_group: string;
  last_donation_date?: string;
  next_eligible_date?: string;
  eligible_for_donation?: boolean;
  pending_responses?: number;
  accepted_requests?: number;
}

export interface HospitalDashboard {
  total_requests: number;
  active_requests: number;
  completed_requests: number;
  total_accepted_donors?: number;
  total_donations?: number;
  total_units_collected?: number;
}

export interface AcceptedDonor {
  donor_id: number;
  response_id: number;
  name: string;
  phone: string;
  email?: string;
  blood_group: string;
  gender?: string;
  city?: string;
  state?: string;
  response_date: string;
  acceptance_status: 'accepted' | 'donated' | 'rejected';
  rejection_reason?: string;
  donated_at?: string;
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
