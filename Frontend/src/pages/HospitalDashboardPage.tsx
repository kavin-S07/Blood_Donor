import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hospitalService } from '../services/hospitalService';
import type { BloodRequest, HospitalDashboard } from '../types/donor';

const urgencyConfig: Record<string, { cls: string; dot: string }> = {
  critical: { cls: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500' },
  high:     { cls: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  medium:   { cls: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-500' },
  low:      { cls: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500' },
};

const statusConfig: Record<string, string> = {
  pending:   'text-amber-600 bg-amber-50',
  accepted:  'text-green-600 bg-green-50',
  completed: 'text-blue-600 bg-blue-50',
  cancelled: 'text-slate-400 bg-slate-50',
};

const StatCard: React.FC<{ label: string; value: number; accent?: boolean; icon: string }> = ({ label, value, accent, icon }) => (
  <div className={`rounded-2xl p-5 border transition-all hover:shadow-md ${
    accent ? 'bg-rose-600 border-rose-600' : 'bg-white border-slate-100 shadow-sm'
  }`}>
    <div className="text-2xl mb-3">{icon}</div>
    <div className={`text-3xl font-bold ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    <div className={`text-sm mt-1 ${accent ? 'text-rose-100' : 'text-slate-500'}`}>{label}</div>
  </div>
);

const HospitalDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<HospitalDashboard | null>(null);
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [dash, reqs] = await Promise.all([
        hospitalService.getDashboard(),
        hospitalService.getRequests(),
      ]);
      setDashboard(dash);
      setRequests(Array.isArray(reqs) ? reqs : []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    try {
      await hospitalService.deleteRequest(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {} finally {
      setDeletingId(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">{user?.name}</p>
        </div>
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Requests" value={dashboard?.total_requests ?? 0} accent icon="📋" />
        <StatCard label="Active" value={dashboard?.active_requests ?? 0} icon="🔴" />
        <StatCard label="Completed" value={dashboard?.completed_requests ?? 0} icon="✅" />
        <StatCard label="Donors Notified" value={dashboard?.total_donors_notified ?? 0} icon="🔔" />
      </div>

      {/* Requests Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-900 font-semibold">Blood Requests</h2>
          <span className="text-slate-400 text-xs bg-slate-100 px-2.5 py-1 rounded-full">{requests.length} total</span>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📋</div>
            <p className="text-slate-900 font-semibold">No requests yet</p>
            <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto">Create your first blood request to start matching with compatible donors</p>
            <Link
              to="/hospital/blood-request"
              className="inline-flex items-center gap-2 mt-5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-rose-200"
            >
              + Create Request
            </Link>
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
                {requests.map((r) => {
                  const urg = urgencyConfig[r.emergency_level] || urgencyConfig.low;
                  const stat = statusConfig[r.status] || 'text-slate-500 bg-slate-50';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-rose-600 font-bold text-base">{r.blood_group}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-[140px] truncate">{r.location}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{r.units_needed}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${urg.cls}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
                          {r.emergency_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`capitalize text-xs font-semibold px-2.5 py-1 rounded-full ${stat}`}>
                          {r.status}
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
