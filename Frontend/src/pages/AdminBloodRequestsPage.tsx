import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService, type AdminBloodRequest } from '../services/adminService';

const urgencyConfig: Record<string, { cls: string; dot: string }> = {
  critical: { cls: 'bg-red-100 text-red-700 border border-red-200',    dot: 'bg-red-500' },
  high:     { cls: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  medium:   { cls: 'bg-amber-100 text-amber-700 border border-amber-200',    dot: 'bg-amber-500' },
  low:      { cls: 'bg-green-100 text-green-700 border border-green-200',    dot: 'bg-green-500' },
};

const statusConfig: Record<string, string> = {
  pending:   'text-amber-600 bg-amber-50 border-amber-200',
  accepted:  'text-blue-600 bg-blue-50 border-blue-200',
  completed: 'text-green-600 bg-green-50 border-green-200',
  cancelled: 'text-slate-500 bg-slate-50 border-slate-200',
};

const AdminBloodRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState<AdminBloodRequest[]>([]);
  const [filtered, setFiltered] = useState<AdminBloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  const load = useCallback(async () => {
    try {
      const list = await adminService.getAllBloodRequests();
      setRequests(Array.isArray(list) ? list : []);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let out = requests;
    if (statusFilter !== 'all') out = out.filter((r) => r.status === statusFilter);
    if (urgencyFilter !== 'all') out = out.filter((r) => r.emergency_level === urgencyFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter(
        (r) => r.blood_group.toLowerCase().includes(q) || r.location.toLowerCase().includes(q)
      );
    }
    setFiltered(out);
  }, [requests, statusFilter, urgencyFilter, search]);

  const statuses = ['all', 'pending', 'accepted', 'completed', 'cancelled'];
  const urgencies = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blood Request Monitoring</h1>
          <p className="text-slate-500 text-sm mt-0.5">All blood requests across the platform</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search blood group, location…"
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-sm w-56"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-sm"
        >
          {statuses.map((s) => (
            <option key={s} value={s}>{s === 'all' ? 'All Statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
          className="px-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-sm"
        >
          {urgencies.map((u) => (
            <option key={u} value={u}>{u === 'all' ? 'All Urgency' : u.charAt(0).toUpperCase() + u.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-900 font-semibold">All Blood Requests</h2>
          <span className="text-slate-400 text-xs bg-slate-100 px-2.5 py-1 rounded-full">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">📋</div>
            <p className="text-slate-900 font-semibold">No requests found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="text-left px-6 py-3.5">ID</th>
                  <th className="text-left px-6 py-3.5">Blood Group</th>
                  <th className="text-left px-6 py-3.5">Location</th>
                  <th className="text-left px-6 py-3.5">Units</th>
                  <th className="text-left px-6 py-3.5">Urgency</th>
                  <th className="text-left px-6 py-3.5">Status</th>
                  <th className="text-left px-6 py-3.5">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r) => {
                  const urg  = urgencyConfig[r.emergency_level] || urgencyConfig.low;
                  const stat = statusConfig[r.status] || 'text-slate-500 bg-slate-50 border-slate-200';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-400 text-xs font-mono">#{r.id}</td>
                      <td className="px-6 py-4">
                        <span className="text-rose-600 font-bold text-base">{r.blood_group}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-[160px] truncate">{r.location}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{r.units_needed}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium capitalize ${urg.cls}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
                          {r.emergency_level}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${stat}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
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

export default AdminBloodRequestsPage;