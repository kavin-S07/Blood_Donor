export interface LiveLocationPayload {
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: string;
}

export interface LiveLocationReceive {
  userId: number;
  latitude: number;
  longitude: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: string;
}

export interface DonorArrivedPayload {
  userId: number;
  requestId: number;
  message: string;
}

export interface LiveLocationRecord {
  id: number;
  user_id: number;
  request_id: number;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  updated_at: string;
  user_name?: string;
}

export interface TrackingHospital {
  id: number;
  name: string;
  address: string;
  contact_number: string;
  latitude: number;
  longitude: number;
}

export interface TrackingDonor {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  accuracy: number | null;
  updatedAt: string;
}

export interface TrackingRequestInfo {
  id: number;
  blood_group: string;
  units_needed: number;
  emergency_level: 'low' | 'medium' | 'high' | 'critical';
  status: string;
}

export interface RouteSummary {
  distance_km: number;
  duration_min: number;
}

export interface TrackingData {
  hospital: TrackingHospital;
  donor: TrackingDonor | null;
  request: TrackingRequestInfo;
  remaining_distance_km: number | null;
  eta_min: number | null;
  route_summary: RouteSummary | null;
}
