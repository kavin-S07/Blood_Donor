import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminService, type AdminDonation } from '../services/adminService';

const AdminDonationsPage: React.FC = () => {
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [filtered, setFiltered] = useState<AdminDonation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const list = await adminService.getDonationHistory();
      setDonations(Array.isArray(list) ? list : []);
    } catch {
      setDonations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    let out = donations;
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((d) => (d.blood_group || '').toLowerCase().includes(q));
    }
    setFiltered(out);
  }, [donations, search]);

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
          <h1 className="text-2xl font-bold text-slate-900">Donation History</h1>
          <p className="text-slate-500 text-sm mt-0.5">All completed donations across the platform</p>
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
            placeholder="Search blood group…"
            className="pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white shadow-sm w-56"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-900 font-semibold">All Donations</h2>
          <span className="text-slate-400 text-xs bg-slate-100 px-2.5 py-1 rounded-full">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">💉</div>
            <p className="text-slate-900 font-semibold">No donations found</p>
            <p className="text-slate-400 text-sm mt-1">Completed donations will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="text-left px-6 py-3.5">ID</th>
                  <th className="text-left px-6 py-3.5">Donor ID</th>
                  <th className="text-left px-6 py-3.5">Hospital ID</th>
                  <th className="text-left px-6 py-3.5">Blood Group</th>
                  <th className="text-left px-6 py-3.5">Units</th>
                  <th className="text-left px-6 py-3.5">Date</th>
                  <th className="text-left px-6 py-3.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-400 text-xs font-mono">#{d.id}</td>
                    <td className="px-6 py-4 text-slate-600">#{d.donor_id}</td>
                    <td className="px-6 py-4 text-slate-600">#{d.hospital_id}</td>
                    <td className="px-6 py-4">
                      <span className="text-rose-600 font-bold text-base">{d.blood_group || '—'}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700 font-medium">{d.units_donated ?? '—'}</td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {d.donation_date
                        ? new Date(d.donation_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-[200px] truncate">{d.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDonationsPage;