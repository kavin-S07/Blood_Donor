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
  hospital_address?: string;
  accepted_count?: number;
  donated_count?: number;
  my_response_status?: 'pending' | 'accepted' | 'rejected' | 'donated';
  hospital_latitude?: number;
  hospital_longitude?: number;
  pickup_latitude?: number;
  pickup_longitude?: number;
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

export interface NearestDonor {
  donor_id: number;
  name: string;
  phone: string;
  blood_group: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  distance_km: number | null;
  duration_min: number | null;
  profile_photo_url?: string | null;
  availability?: boolean;
  eligible_for_donation?: boolean;
}

// Response shape for the Smart Nearest Donor Matching endpoints
// (GET /donor/nearest and GET /request/:id/nearest)
export interface NearestDonorsResult {
  donors: NearestDonor[];
  total_compatible: number;
  routing_unavailable: number;
  message?: string;
}

export type NotifyScope = 'top5' | 'top10' | 'all';

export interface NotifyDonorsResult {
  notified: number;
  scope: NotifyScope;
}

export interface DonorLocation {
  donorId: number;
  latitude: number;
  longitude: number;
  updatedAt: string;
}

export interface RouteInfo {
  distance_km: number;
  duration_min: number;
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
export const EMERGENCY_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

// ── Donor Navigation feature ────────────────────────────────────
// Response shape for GET /api/request/:id/route
export interface NavigationHospital {
  id: number;
  name: string;
  address: string;
  contact_number: string;
  latitude: number;
  longitude: number;
}

export interface NavigationDonor {
  id: number;
  name: string;
  blood_group: string;
  latitude: number;
  longitude: number;
}

export interface NavigationRequestInfo {
  id: number;
  blood_group: string;
  units_needed: number;
  emergency_level: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}

export interface NavigationRoute {
  hospital: NavigationHospital;
  donor: NavigationDonor;
  request: NavigationRequestInfo;
  distance: string;
  distance_km: number;
  duration: string;
  duration_min: number;
  estimatedArrival: string;
  geometry: [number, number][]; // [lat, lng] pairs
}