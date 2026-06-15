import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService, type AdminStats } from '../services/adminService';

const StatCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  accent?: boolean;
  to?: string;
  color?: string;
}> = ({ label, value, icon, accent, to, color = 'rose' }) => {
  const colorMap: Record<string, string> = {
    rose:   'bg-rose-600 border-rose-600',
    amber:  'bg-amber-500 border-amber-500',
    green:  'bg-green-600 border-green-600',
    blue:   'bg-blue-600 border-blue-600',
    slate:  'bg-slate-500 border-slate-500',
  };
  const card = (
    <div className={`rounded-2xl p-5 border transition-all hover:shadow-md cursor-pointer ${
      accent
        ? `${colorMap[color]} text-white`
        : 'bg-white border-slate-100 shadow-sm hover:border-rose-200'
    }`}>
      <div className="text-2xl mb-3">{icon}</div>
      <div className={`text-3xl font-bold ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</div>
      <div className={`text-sm mt-1 ${accent ? 'text-white/80' : 'text-slate-500'}`}>{label}</div>
    </div>
  );
  return to ? <Link to={to}>{card}</Link> : card;
};

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const s = await adminService.getDashboardStats();
      setStats(s);
    } catch {
      setError('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">BloodConnect platform overview</p>
        </div>
        <Link
          to="/admin/hospitals/pending"
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-rose-200"
        >
          🏥 Review Pending Hospitals
          {stats && stats.pending_hospitals > 0 && (
            <span className="bg-white text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.pending_hospitals}
            </span>
          )}
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Pending Alert */}
      {stats && stats.pending_hospitals > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <p className="text-amber-800 font-semibold text-sm">
              {stats.pending_hospitals} hospital{stats.pending_hospitals > 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-amber-600 text-xs mt-0.5">
              Review and approve or reject pending hospital registrations.
            </p>
          </div>
          <Link
            to="/admin/hospitals/pending"
            className="text-amber-700 border border-amber-300 hover:bg-amber-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Review →
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Donors"       value={stats?.total_donors ?? 0}           icon="🩸" accent color="rose" to="/admin/users" />
        <StatCard label="Active Hospitals"   value={stats?.total_hospitals ?? 0}         icon="🏥" accent color="blue" to="/admin/hospitals" />
        <StatCard label="Blood Requests"     value={stats?.total_blood_requests ?? 0}    icon="📋" accent color="slate" to="/admin/requests" />
        <StatCard label="Total Donations"    value={stats?.total_donations ?? 0}          icon="💉" accent color="green" to="/admin/donations" />
      </div>

      {/* Hospital Approval Stats */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-slate-900 font-semibold mb-5">Hospital Registration Status</h2>
        <div className="grid grid-cols-3 gap-4">
          <Link to="/admin/hospitals/pending" className="group text-center p-4 rounded-xl bg-amber-50 border border-amber-100 hover:border-amber-300 transition-all">
            <div className="text-3xl font-bold text-amber-600">{stats?.pending_hospitals ?? 0}</div>
            <div className="text-xs text-amber-500 mt-1 font-medium">Pending</div>
          </Link>
          <Link to="/admin/hospitals/approved" className="group text-center p-4 rounded-xl bg-green-50 border border-green-100 hover:border-green-300 transition-all">
            <div className="text-3xl font-bold text-green-600">{stats?.approved_hospitals ?? 0}</div>
            <div className="text-xs text-green-500 mt-1 font-medium">Approved</div>
          </Link>
          <Link to="/admin/hospitals/rejected" className="group text-center p-4 rounded-xl bg-red-50 border border-red-100 hover:border-red-300 transition-all">
            <div className="text-3xl font-bold text-red-600">{stats?.rejected_hospitals ?? 0}</div>
            <div className="text-xs text-red-400 mt-1 font-medium">Rejected</div>
          </Link>
        </div>
      </div>

      {/* Quick Nav */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { to: '/admin/hospitals', icon: '🏥', label: 'Hospital Management', desc: 'View and manage all hospitals' },
          { to: '/admin/users',     icon: '👥', label: 'User Management',     desc: 'View and control all users' },
          { to: '/admin/requests',  icon: '📋', label: 'Blood Requests',      desc: 'Monitor all blood requests' },
          { to: '/admin/donations', icon: '💉', label: 'Donation History',    desc: 'Track all donations' },
        ].map(({ to, icon, label, desc }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center justify-between bg-white border border-slate-100 hover:border-rose-300 rounded-2xl p-5 transition-all hover:shadow-md shadow-sm"
          >
            <div>
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-slate-900 font-semibold text-sm">{label}</div>
              <div className="text-slate-400 text-xs mt-0.5">{desc}</div>
            </div>
            <div className="w-9 h-9 bg-rose-50 group-hover:bg-rose-600 rounded-xl flex items-center justify-center transition-all flex-shrink-0">
              <svg className="w-4 h-4 text-rose-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardPage;