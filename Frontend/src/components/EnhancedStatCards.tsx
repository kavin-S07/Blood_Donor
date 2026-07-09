import React from 'react';
import type { EnhancedDashboard } from '../types/analytics';

interface EnhancedStatCardsProps {
  dashboard: EnhancedDashboard | null;
  loading: boolean;
}

const StatCard: React.FC<{ label: string; value: string | number; icon: string; accent?: boolean; sub?: string }> = ({ label, value, icon, accent, sub }) => (
  <div className={`rounded-2xl p-5 border transition-all hover:shadow-md ${
    accent ? 'bg-rose-600 border-rose-600' : 'bg-white border-slate-100 shadow-sm'
  }`}>
    <div className="text-2xl mb-3">{icon}</div>
    <div className={`text-3xl font-bold ${accent ? 'text-white' : 'text-slate-900'}`}>{value}</div>
    <div className={`text-sm mt-1 ${accent ? 'text-rose-100' : 'text-slate-500'}`}>{label}</div>
    {sub && <div className={`text-xs mt-0.5 ${accent ? 'text-rose-200' : 'text-slate-400'}`}>{sub}</div>}
  </div>
);

const EnhancedStatCards: React.FC<EnhancedStatCardsProps> = ({ dashboard, loading }) => {
  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-2xl p-5 bg-white border border-slate-100 shadow-sm animate-pulse">
          <div className="w-8 h-8 bg-slate-200 rounded-lg mb-3" />
          <div className="h-8 bg-slate-200 rounded w-16 mb-2" />
          <div className="h-4 bg-slate-100 rounded w-24" />
        </div>
      ))}
    </div>
  );

  if (!dashboard) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatCard label="Total Requests" value={dashboard.total_requests} accent icon="📋" sub={`${dashboard.active_requests} active`} />
      <StatCard label="Completed" value={dashboard.completed_requests} icon="✅" sub={`${dashboard.total_units_collected} units collected`} />
      <StatCard label="Response Rate" value={dashboard.response_rate != null ? `${dashboard.response_rate}%` : '—'} icon="📊" sub={`${dashboard.total_accepted_donors ?? 0} total donors`} />
      <StatCard label="Total Donations" value={dashboard.total_donations ?? 0} icon="🩸" />
      <StatCard label="Avg Response Time" value={dashboard.avg_response_time_min != null ? `${dashboard.avg_response_time_min}m` : '—'} icon="⏱️" sub="Request → Accept" />
      <StatCard label="Avg Travel Time" value={dashboard.avg_travel_time_min != null ? `${dashboard.avg_travel_time_min}m` : '—'} icon="🚗" sub="Accept → Arrive" />
      <StatCard label="Avg Donation Time" value={dashboard.avg_donation_time_min != null ? `${dashboard.avg_donation_time_min}m` : '—'} icon="🏥" sub="Arrive → Complete" />
      <StatCard label="Accepted Requests" value={dashboard.accepted_requests} icon="📌" />
    </div>
  );
};

export default EnhancedStatCards;
