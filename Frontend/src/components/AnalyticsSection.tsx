import React from 'react';
import type { Analytics } from '../types/analytics';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface AnalyticsSectionProps {
  analytics: Analytics | null;
  loading: boolean;
}

const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ analytics, loading }) => {
  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!analytics) return null;

  const maxRequests = Math.max(...analytics.monthly_stats.map(s => s.total_requests), 1);

  return (
    <div className="space-y-6">
      {/* Monthly Trends */}
      <div>
        <h3 className="text-slate-900 font-semibold mb-3">Monthly Trends</h3>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
          {analytics.monthly_stats.map((stat) => {
            const pct = (stat.total_requests / maxRequests) * 100;
            return (
              <div key={`${stat.year}-${stat.month}`} className="flex flex-col items-center gap-1">
                <div className="relative w-full bg-slate-100 rounded-full" style={{ height: 64 }}>
                  <div
                    className="absolute bottom-0 left-0 w-full bg-rose-500 rounded-full transition-all"
                    style={{ height: `${Math.max(pct, 4)}%` }}
                  />
                  {stat.total_units > 0 && (
                    <div
                      className="absolute bottom-0 left-0 w-full bg-rose-300 rounded-full transition-all"
                      style={{ height: `${Math.max((stat.total_units / maxRequests) * 100, 2)}%` }}
                    />
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{MONTHS[stat.month - 1]}</span>
                <span className="text-[10px] text-slate-500">{stat.total_requests}</span>
              </div>
            );
          })}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-slate-400">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Requests</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-300" /> Units</span>
        </div>
      </div>

      {/* Blood Group Distribution */}
      <div>
        <h3 className="text-slate-900 font-semibold mb-3">Blood Group Distribution</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {analytics.blood_group_distribution.map((bg) => {
            const pct = analytics.monthly_stats.length > 0
              ? Math.round((bg.total_requests / Math.max(...analytics.monthly_stats.map(s => s.total_requests), 1)) * 100)
              : 0;
            return (
              <div key={bg.blood_group} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="text-rose-600 font-bold text-lg">{bg.blood_group}</div>
                <div className="text-xs text-slate-500 mt-1">{bg.total_requests} requests</div>
                <div className="text-xs text-green-600">{bg.completed_count} completed</div>
                <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                  <div className="bg-rose-500 rounded-full h-1.5" style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Urgency Distribution */}
      <div>
        <h3 className="text-slate-900 font-semibold mb-3">By Emergency Level</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {analytics.urgency_distribution.map((urg) => {
            const colorMap: Record<string, string> = {
              critical: 'bg-red-500',
              high: 'bg-orange-500',
              medium: 'bg-amber-500',
              low: 'bg-green-500',
            };
            const labelMap: Record<string, string> = {
              critical: 'Critical',
              high: 'High',
              medium: 'Medium',
              low: 'Low',
            };
            return (
              <div key={urg.emergency_level} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className={`w-2.5 h-2.5 rounded-full ${colorMap[urg.emergency_level] || 'bg-slate-400'} mb-2`} />
                <div className="text-sm font-semibold text-slate-900">{labelMap[urg.emergency_level] || urg.emergency_level}</div>
                <div className="text-xs text-slate-500 mt-0.5">{urg.total_requests} requests</div>
                <div className="text-xs text-green-600">{urg.completed_count} completed</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;
