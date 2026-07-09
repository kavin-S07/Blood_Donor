import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hospitalService } from '../services/hospitalService';
import { profileService } from '../services/Profileservice';
import { notificationService } from '../services/notificationService';
import { connectSocket, watchDonors } from '../services/socketService';
import type { BloodRequest, DonorLocation, RouteInfo, NearestDonor, Notification } from '../types/donor';
import type { LiveLocationReceive, DonorArrivedPayload } from '../types/liveTracking';
import type { EnhancedDashboard, Analytics } from '../types/analytics';
import LiveTrackingMap from '../components/LiveTrackingMap';
import NearestDonorsPanel from '../components/NearestDonorsPanel';
import EnhancedStatCards from '../components/EnhancedStatCards';
import AnalyticsSection from '../components/AnalyticsSection';
import FilterPanel from '../components/FilterPanel';
import NotificationPanel from '../components/NotificationPanel';

const urgencyConfig: Record<string, { cls: string; dot: string }> = {
  critical: { cls: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500' },
  high:     { cls: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  medium:   { cls: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  low:      { cls: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500' },
};

const statusConfig: Record<string, string> = {
  pending:             'text-amber-600 bg-amber-50',
  accepted:            'text-blue-600 bg-blue-50',
  arrived:             'text-green-600 bg-green-50',
  completed:           'text-green-600 bg-green-50',
  partially_completed: 'text-orange-600 bg-orange-50',
  cancelled:           'text-slate-400 bg-slate-50',
};

const HospitalDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<EnhancedDashboard | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<BloodRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };
  const [donorLocations, setDonorLocations] = useState<Map<number, DonorLocation>>(new Map());
  const [trackedRequestId, setTrackedRequestId] = useState<number | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [hospitalCoords, setHospitalCoords] = useState<{ lat: number; lng: number } | null>(null);
  const socketInitialized = useRef(false);

  const [nearestDonors, setNearestDonors] = useState<NearestDonor[]>([]);
  const [nearestLoading, setNearestLoading] = useState(true);
  const [nearestError, setNearestError] = useState<string | null>(null);
  const [nearestRoutingUnavailable, setNearestRoutingUnavailable] = useState(0);

  // ── Live tracking state ───────────────────────────────────────
  const [liveDonorPos, setLiveDonorPos] = useState<{ lat: number; lng: number; heading?: number | null; speed?: number | null } | null>(null);
  const [liveRouteGeometry, setLiveRouteGeometry] = useState<[number, number][] | undefined>(undefined);
  const [liveTrackingActive, setLiveTrackingActive] = useState(false);
  const [arrivedMessage, setArrivedMessage] = useState<string | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  // ── Enhanced dashboard state ──────────────────────────────────
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  // ── Notifications ─────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    try {
      const [dash, reqs] = await Promise.all([
        hospitalService.getEnhancedDashboard(),
        hospitalService.getRequests(),
      ]);
      setDashboard(dash);
      setRequests(Array.isArray(reqs) ? reqs : []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const [notifData, count] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getUnreadCount(),
      ]);
      setNotifications(Array.isArray(notifData) ? notifData : []);
      setUnreadCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    load();
    loadNotifications();
  }, [load, loadNotifications]);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const data = await hospitalService.getAnalytics();
      setAnalytics(data);
    } catch {} finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const [donorMapCoords, setDonorMapCoords] = useState<{ lat: number; lng: number } | null>(null);

  const loadNearestDonors = useCallback(async () => {
    setNearestLoading(true);
    setNearestError(null);
    try {
      const [result, profile] = await Promise.all([
        hospitalService.getNearestDonorsOverview(5),
        profileService.getProfile().catch(() => null),
      ]);
      setNearestDonors(result.donors);
      setNearestRoutingUnavailable(result.routing_unavailable);
      if (result.message) setNearestError(result.message);
      const hLat = profile?.profile?.latitude;
      const hLng = profile?.profile?.longitude;
      if (hLat && hLng) setDonorMapCoords({ lat: hLat, lng: hLng });
    } catch {
      setNearestError('Unable to load nearest donors right now.');
    } finally {
      setNearestLoading(false);
    }
  }, []);

  useEffect(() => { loadNearestDonors(); }, [loadNearestDonors]);

  useEffect(() => {
    const accepted = requests.find(r => r.status === 'accepted');
    if (accepted && !socketInitialized.current) {
      socketInitialized.current = true;
      const socket = connectSocket();

      socket.on('donor:location', (location: DonorLocation) => {
        setDonorLocations(prev => {
          const next = new Map(prev);
          next.set(location.donorId, location);
          return next;
        });
      });

      socket.on('donor:route', (route: RouteInfo | null) => {
        if (route) setRouteInfo(route);
      });

      if (accepted.hospital_latitude && accepted.hospital_longitude) {
        setHospitalCoords({
          lat: accepted.hospital_latitude,
          lng: accepted.hospital_longitude,
        });
      }
    }
  }, [requests]);

  // ── Live tracking socket listeners ────────────────────────────
  useEffect(() => {
    if (!trackedRequestId) {
      setLiveDonorPos(null);
      setLiveTrackingActive(false);
      setArrivedMessage(null);
      return;
    }

    const socket = connectSocket();
    watchDonors(trackedRequestId);
    setLiveTrackingActive(true);

    const handleLocationReceive = (data: LiveLocationReceive) => {
      setLiveDonorPos({
        lat: data.latitude,
        lng: data.longitude,
        heading: data.heading,
        speed: data.speed,
      });
      setLastUpdateTime(data.timestamp);
    };

    const handleDonorArrived = (data: DonorArrivedPayload) => {
      setArrivedMessage(data.message);
      setLiveTrackingActive(false);
    };

    socket.on('location:receive', handleLocationReceive);
    socket.on('donor:arrived', handleDonorArrived);

    return () => {
      socket.off('location:receive', handleLocationReceive);
      socket.off('donor:arrived', handleDonorArrived);
    };
  }, [trackedRequestId]);

  const handleWatchRequest = (requestId: number) => {
    setTrackedRequestId(requestId);
    setArrivedMessage(null);
    setLiveDonorPos(null);
    const req = requests.find(r => r.id === requestId);
    if (req?.hospital_latitude && req?.hospital_longitude) {
      setHospitalCoords({ lat: req.hospital_latitude, lng: req.hospital_longitude });
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await hospitalService.deleteRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setFilteredRequests((prev) => prev ? prev.filter((r) => r.id !== id) : null);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || '❌ Failed to delete request');
    } finally {
      setDeletingId(null);
    }
  };

  // ── Filter handlers ───────────────────────────────────────────
  const handleApplyFilters = async (filters: Record<string, string | undefined>) => {
    setFilterLoading(true);
    try {
      const data = await hospitalService.getFilteredRequests(filters);
      setFilteredRequests(Array.isArray(data) ? data : []);
    } catch {} finally {
      setFilterLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilteredRequests(null);
  };

  // ── Notification handlers ─────────────────────────────────────
  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleToggleAnalytics = () => {
    if (!showAnalytics && !analytics) loadAnalytics();
    setShowAnalytics(!showAnalytics);
  };

  // ── Notify next nearest donor for a request ──────────────────
  const handleNotifyNext = async (requestId: number) => {
    try {
      const result = await hospitalService.notifyNextNearestDonor(requestId);
      if (result.notified) {
        alert(`Notified ${result.donor_name} as the next nearest donor.`);
        load();
      } else {
        alert(result.message || 'No more donors available.');
      }
    } catch {
      alert('Failed to notify next donor.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const displayRequests = filteredRequests ?? requests;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">{user?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationPanel
            inAppNotifications={notifications}
            inAppUnread={unreadCount}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
          />
          <Link
            to="/hospital/history"
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition-all"
          >
            📋 Donation Records
          </Link>
          <Link
            to="/hospital/blood-request"
            className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-rose-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Blood Request
          </Link>
        </div>
      </div>

      {/* Enhanced Stats */}
      <EnhancedStatCards dashboard={dashboard} loading={loading} />

      {/* Analytics Toggle */}
      <div className="mb-8">
        <button
          onClick={handleToggleAnalytics}
          className="inline-flex items-center gap-2 text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-4 py-2 rounded-xl transition-colors"
        >
          <svg className={`w-4 h-4 transition-transform ${showAnalytics ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
        </button>

        {showAnalytics && (
          <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <AnalyticsSection analytics={analytics} loading={analyticsLoading} />
          </div>
        )}
      </div>

      {/* Nearest Eligible Donors */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-slate-900 font-semibold">🩸 Nearest Eligible Donors</h2>
            <p className="text-slate-400 text-xs mt-0.5">Ranked by real road distance &amp; ETA via OSRM</p>
          </div>
        </div>
        <div className="p-6">
          <NearestDonorsPanel
            donors={nearestDonors}
            loading={nearestLoading}
            error={nearestError}
            hospitalCoords={donorMapCoords}
            routingUnavailable={nearestRoutingUnavailable}
            emptyMessage="No nearby eligible donors found. Create a blood request to notify compatible donors."
          />
        </div>
      </div>

      {/* Live Tracking Map */}
      {acceptedRequests.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-slate-900 font-semibold">📍 Live Donor Tracking</h2>
            <p className="text-slate-400 text-xs mt-0.5">Real-time location of donors heading to your hospital</p>
          </div>

          {arrivedMessage && (
            <div className="mx-6 mt-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
              <p className="text-green-700 font-semibold text-sm">✅ {arrivedMessage}</p>
            </div>
          )}

          {trackedRequestId && hospitalCoords ? (
            <div>
              <LiveTrackingMap
                hospitalPosition={hospitalCoords}
                donorPosition={liveDonorPos}
                geometry={liveRouteGeometry}
                hospitalName={requests.find(r => r.id === trackedRequestId)?.hospital_name}
                height="400px"
              />
              {lastUpdateTime && (
                <div className="px-6 py-2 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
                  Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
                </div>
              )}
              {routeInfo && !liveDonorPos && (
                <div className="px-6 py-3 bg-blue-50 border-t border-blue-100 flex gap-6 text-sm">
                  <span className="text-blue-700">🚗 <strong>{routeInfo.distance_km} km</strong> away</span>
                  <span className="text-blue-700">⏱ ETA: <strong>{routeInfo.duration_min} min</strong></span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-slate-500 text-sm mb-3">Select a request below to start tracking donors</p>
            </div>
          )}

          <div className="border-t border-slate-100 px-6 py-3">
            <p className="text-xs text-slate-400 mb-2">Accepted requests — click to start tracking:</p>
            <div className="flex flex-wrap gap-2">
              {acceptedRequests.map(req => (
                <button
                  key={req.id}
                  onClick={() => handleWatchRequest(req.id)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium border transition-colors ${
                    trackedRequestId === req.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}
                >
                  #{req.id} — {req.blood_group}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Panel */}
      <div className="mb-4">
        <FilterPanel
          onApply={handleApplyFilters}
          onReset={handleResetFilters}
          loading={filterLoading}
        />
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-900 font-semibold">Blood Requests</h2>
          <div className="flex items-center gap-2">
            {filteredRequests !== null && (
              <span className="text-xs text-rose-600 font-medium">{filteredRequests.length} filtered</span>
            )}
            <span className="text-slate-400 text-xs bg-slate-100 px-2.5 py-1 rounded-full">{requests.length} total</span>
          </div>
        </div>

        {displayRequests.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📋</div>
            <p className="text-slate-900 font-semibold">No requests yet</p>
            <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">
              {filteredRequests !== null ? 'No requests match the selected filters.' : 'Create your first blood request to start matching with compatible donors.'}
            </p>
            {filteredRequests === null && (
              <Link
                to="/hospital/blood-request"
                className="inline-flex items-center gap-2 mt-5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-200"
              >
                + Create Request
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="text-left px-6 py-3.5">Blood Group</th>
                  <th className="text-left px-6 py-3.5">Location</th>
                  <th className="text-left px-6 py-3.5">Units</th>
                  <th className="text-left px-6 py-3.5">Urgency</th>
                  <th className="text-left px-6 py-3.5">Status</th>
                  <th className="text-left px-6 py-3.5">Date</th>
                  <th className="text-right px-6 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayRequests.map((r) => {
                  const urg  = urgencyConfig[r.emergency_level] || urgencyConfig.low;
                  const stat = statusConfig[r.status] || 'text-slate-500 bg-slate-50';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-rose-600 font-bold text-base">{r.blood_group}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-[140px] truncate">{r.location}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {r.units_received != null
                          ? <span>{r.units_received}<span className="text-slate-300">/{r.units_needed}</span></span>
                          : r.units_needed}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${urg.cls}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
                          {r.emergency_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`capitalize text-xs font-semibold px-2.5 py-1 rounded-full ${stat}`}>
                          {r.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/hospital/request/${r.id}`)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold border border-rose-200 hover:border-rose-400 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            View
                          </button>
                          {(r.status === 'pending' || r.status === 'accepted') && (
                            <button
                              onClick={() => handleNotifyNext(r.id)}
                              className="text-xs text-amber-600 hover:text-amber-700 font-semibold border border-amber-200 hover:border-amber-400 px-3 py-1.5 rounded-lg transition-colors"
                              title="Notify the next nearest compatible donor"
                            >
                              📨 Notify Next
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(r.id)}
                            disabled={deletingId === r.id}
                            className="text-xs text-slate-400 hover:text-red-500 border border-slate-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            {deletingId === r.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDashboardPage;
