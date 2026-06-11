import React, { useEffect, useState, useCallback } from 'react';
import { donorService } from '../services/donorService';
import type { BloodRequest } from '../types/donor';

const urgencyConfig: Record<string, { label: string; cls: string; dot: string }> = {
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500' },
  high:     { label: 'High',     cls: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   cls: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-400' },
  low:      { label: 'Low',      cls: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500' },
};

const BloodRequestPage: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const data = await donorService.getMatchingRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAccept = async (id: number) => {
    setActing(id);
    try {
      await donorService.acceptRequest(id);
      showToast('Request accepted! The hospital will be notified.', 'success');
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(msg || 'Failed to accept request', 'error');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (id: number) => {
    setActing(id);
    try {
      await donorService.rejectRequest(id);
      showToast('Request skipped.', 'success');
      load();
    } catch {} finally {
      setActing(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {toast && (
        <div className={`fixed top-20 right-4 flex items-center gap-3 text-sm px-5 py-3.5 rounded-xl shadow-lg z-50 animate-fade-in border ${
          toast.type === 'success'
            ? 'bg-white border-green-200 text-green-700'
            : 'bg-white border-red-200 text-red-700'
        }`}>
          <span>{toast.type === 'success' ? '✓' : '!'}</span>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blood Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Requests compatible with your blood type</p>
        </div>
        <button
          onClick={load}
          className="text-sm text-rose-600 hover:text-rose-700 font-medium border border-rose-200 hover:border-rose-400 px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🩸</div>
          <p className="text-slate-900 font-semibold">No matching requests</p>
          <p className="text-slate-500 text-sm mt-2">You'll be notified when a hospital needs your blood type</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const urg = urgencyConfig[req.emergency_level] || urgencyConfig.low;
            return (
              <div
                key={req.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 hover:border-rose-200 hover:shadow-md transition-all shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4 flex-wrap">
                      <div className="w-12 h-12 bg-rose-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {req.blood_group}
                      </div>
                      <div>
                        <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${urg.cls}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
                          {urg.label}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">{new Date(req.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {req.hospital_name && (
                        <div className="flex items-center gap-2 text-slate-600">
                          <span className="w-5 text-center">🏥</span> {req.hospital_name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="w-5 text-center">📍</span> {req.location}
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <span className="w-5 text-center">🩸</span> {req.units_needed} unit{req.units_needed !== 1 ? 's' : ''} needed
                      </div>
                      {req.description && (
                        <div className="text-slate-400 text-xs mt-2 bg-slate-50 rounded-lg px-3 py-2 italic">
                          "{req.description}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col min-w-[100px]">
                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={acting === req.id}
                      className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                    >
                      {acting === req.id ? '…' : 'Accept'}
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      disabled={acting === req.id}
                      className="flex-1 sm:flex-none border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 text-sm px-5 py-2.5 rounded-xl transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BloodRequestPage;
