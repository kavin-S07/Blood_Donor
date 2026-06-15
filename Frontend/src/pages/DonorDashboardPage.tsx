import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { donorService } from '../services/donorService';
import type { DonorDashboard } from '../types/donor';

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; accent?: boolean; icon?: string }> = ({
  label, value, sub, accent, icon,
}) => (
  <div className={`rounded-2xl p-5 border transition-all hover:shadow-md ${
    accent
      ? 'bg-rose-600 border-rose-600 text-white'
      : 'bg-white border-slate-100 shadow-sm'
  }`}>
    {icon && <div className="text-2xl mb-3">{icon}</div>}
    <div className={`text-2xl font-bold ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    <div className={`text-sm mt-1 ${accent ? 'text-rose-100' : 'text-slate-500'}`}>{label}</div>
    {sub && <div className={`text-xs mt-0.5 ${accent ? 'text-rose-200' : 'text-slate-400'}`}>{sub}</div>}
  </div>
);

const DonorDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DonorDashboard | null>(null);
  const [available, setAvailable] = useState(true);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await donorService.getDashboard();
      setDashboard(data);
      setAvailable(data.availability ?? true);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAvailability = async () => {
    setTogglingAvail(true);
    try {
      await donorService.updateAvailability(!available);
      setAvailable((v) => !v);
    } catch {} finally {
      setTogglingAvail(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isEligible = (() => {
    if (dashboard?.eligible_for_donation === false) {
      const nextDate = dashboard?.next_eligible_date ? new Date(dashboard.next_eligible_date) : null;
      if (nextDate && nextDate > new Date()) return false; // still in waiting period
    }
    return true;
  })();
  const nextDate   = dashboard?.next_eligible_date ? new Date(dashboard.next_eligible_date) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Your donor overview</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
          <span className="text-slate-600 text-sm font-medium">Available to donate</span>
          <button
            onClick={toggleAvailability}
            disabled={togglingAvail}
            className={`relative w-12 h-6 rounded-full transition-all ${available ? 'bg-rose-600' : 'bg-slate-200'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${available ? 'translate-x-7' : 'translate-x-1'}`} />
          </button>
          <span className={`text-xs font-semibold ${available ? 'text-rose-600' : 'text-slate-400'}`}>
            {available ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

      {/* Eligibility Warning Banner */}
      {!isEligible && nextDate && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-start gap-3">
          <span className="text-2xl">⏳</span>
          <div>
            <p className="text-amber-800 font-semibold text-sm">Temporarily Ineligible</p>
            <p className="text-amber-600 text-xs mt-0.5">
              You recently donated blood. You can donate again from{' '}
              <span className="font-semibold">{nextDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Donations" value={dashboard?.total_donations ?? 0} accent icon="🩸" />
        <StatCard label="Blood Group" value={dashboard?.blood_group ?? '—'} icon="💉" />
        <StatCard
          label="Last Donation"
          value={dashboard?.last_donation_date ? new Date(dashboard.last_donation_date).toLocaleDateString() : 'Never'}
          icon="📅"
        />
        <StatCard
          label="Next Eligible"
          value={
            isEligible
              ? 'Eligible Now'
              : nextDate
              ? nextDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
              : '—'
          }
          sub={
            isEligible
              ? undefined
              : nextDate
              ? nextDate.toLocaleDateString('en-IN', { year: 'numeric' })
              : undefined
          }
          icon={isEligible ? '✅' : '⏳'}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-8">
        <Link
          to="/donor/requests"
          className="group flex items-center justify-between bg-white border border-slate-100 hover:border-rose-300 rounded-2xl p-6 transition-all hover:shadow-md shadow-sm"
        >
          <div>
            <div className="text-2xl mb-2">🩸</div>
            <div className="text-slate-900 font-semibold">Blood Requests</div>
            <div className="text-slate-500 text-sm mt-1">View requests matching your blood type</div>
          </div>
          <div className="w-10 h-10 bg-rose-50 group-hover:bg-rose-600 rounded-xl flex items-center justify-center transition-all">
            <svg className="w-5 h-5 text-rose-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </Link>
        <Link
          to="/donor/history"
          className="group flex items-center justify-between bg-white border border-slate-100 hover:border-rose-300 rounded-2xl p-6 transition-all hover:shadow-md shadow-sm"
        >
          <div>
            <div className="text-2xl mb-2">📋</div>
            <div className="text-slate-900 font-semibold">Donation History</div>
            <div className="text-slate-500 text-sm mt-1">See your past donations</div>
          </div>
          <div className="w-10 h-10 bg-rose-50 group-hover:bg-rose-600 rounded-xl flex items-center justify-center transition-all">
            <svg className="w-5 h-5 text-rose-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </div>
        </Link>
      </div>

      {/* Blood compatibility */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
        <h2 className="text-slate-900 font-semibold mb-1">Blood Type Reference</h2>
        <p className="text-slate-500 text-sm mb-5">Your blood type is highlighted below</p>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((g) => (
            <div
              key={g}
              className={`text-center py-3 rounded-xl text-sm font-bold border transition-all ${
                dashboard?.blood_group === g
                  ? 'bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-200'
                  : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-rose-200'
              }`}
            >
              {g}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DonorDashboardPage;
