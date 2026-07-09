export interface EnhancedDashboard {
  total_requests: number;
  active_requests: number;
  completed_requests: number;
  accepted_requests: number;
  total_accepted_donors?: number;
  total_donations?: number;
  total_units_collected?: number;
  response_rate: number;
  avg_response_time_min: number | null;
  avg_travel_time_min: number | null;
  avg_donation_time_min: number | null;
}

export interface MonthlyStat {
  year: number;
  month: number;
  total_requests: number;
  completed_requests: number;
  total_units: number;
}

export interface BloodGroupDist {
  blood_group: string;
  total_requests: number;
  completed_count: number;
}

export interface UrgencyDist {
  emergency_level: string;
  total_requests: number;
  completed_count: number;
}

export interface Analytics {
  monthly_stats: MonthlyStat[];
  blood_group_distribution: BloodGroupDist[];
  urgency_distribution: UrgencyDist[];
}

export interface FilterParams {
  blood_group?: string;
  status?: string;
  emergency_level?: string;
  date_from?: string;
  date_to?: string;
  name?: string;
  limit?: number;
}

export interface NotificationLog {
  id: number;
  request_id: number | null;
  sender_id: number;
  recipient_id: number;
  type: string;
  channel: string;
  title: string;
  message: string;
  created_at: string;
  sender_name: string;
  recipient_name: string;
}

export interface NotifyNextResult {
  notified: boolean;
  donor_id?: number;
  donor_name?: string;
  distance_km?: number;
  duration_min?: number;
  message?: string;
}
