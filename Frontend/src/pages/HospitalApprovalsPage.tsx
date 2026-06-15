import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminService, type PendingHospital } from '../services/adminService';

type TabKey = 'pending' | 'approved' | 'rejected';

const TAB_LABELS: Record<TabKey, string> = {
  pending:  '⏳ Pending',
  approved: '✅ Approved',
  rejected: '❌ Rejected',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg: Record<string, string> = {
    pending:  'bg-amber-100 text-amber-700 border-amber-200',
    approved: 'bg-green-100 text-green-700 border-green-200',
    rejected: 'bg-red-100 text-red-700 border-red-200',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${cfg[status] || 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  );
};

/* ── Reject Modal ── */
const RejectModal: React.FC<{
  hospital: PendingHospital;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}> = ({ hospital, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-1">Reject Hospital</h3>
        <p className="text-slate-500 text-sm mb-5">
          You are about to reject <strong>{hospital.hospital_name}</strong>. Provide an optional reason.
        </p>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection (optional)…"
          rows={3}
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none mb-5"
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-slate-200 hover:border-slate-300 text-slate-600 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
          >
            {loading ? 'Rejecting…' : 'Reject Hospital'}
          </button>
        </div>
      </div>
    </div>
  );
};

const HospitalApprovalsPage: React.FC = () => {
  const { tab } = useParams<{ tab?: TabKey }>();
  const activeTab: TabKey = (tab as TabKey) || 'pending';

  const [hospitals, setHospitals] = useState<PendingHospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingHospital | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const loaders: Record<TabKey, () => Promise<PendingHospital[]>> = {
        pending:  adminService.getPendingHospitals,
        approved: adminService.getApprovedHospitals,
        rejected: adminService.getRejectedHospitals,
      };
      const list = await loaders[activeTab]();
      setHospitals(Array.isArray(list) ? list : []);
    } catch {
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (hospital: PendingHospital) => {
    setActionId(hospital.id);
    try {
      await adminService.approveHospital(hospital.id);
      showToast(`✅ ${hospital.hospital_name} approved successfully`);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || '❌ Failed to approve hospital');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (reason: string) => {
    if (!rejectTarget) return;
    setRejectLoading(true);
    try {
      await adminService.rejectHospital(rejectTarget.id, reason);
      showToast(`❌ ${rejectTarget.hospital_name} rejected`);
      setRejectTarget(null);
      load();
    } catch (err: any) {
      showToast(err?.response?.data?.message || '❌ Failed to reject hospital');
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-sm px-5 py-3 rounded-xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          hospital={rejectTarget}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
          loading={rejectLoading}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin" className="text-slate-400 hover:text-slate-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hospital Management</h1>
          <p className="text-slate-500 text-sm mt-0.5">Review and manage hospital registrations</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 mb-6 w-fit">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((t) => (
          <Link
            key={t}
            to={`/admin/hospitals/${t}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {TAB_LABELS[t]}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-slate-900 font-semibold capitalize">{activeTab} Hospitals</h2>
          <span className="text-slate-400 text-xs bg-slate-100 px-2.5 py-1 rounded-full">{hospitals.length} total</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🏥</div>
            <p className="text-slate-900 font-semibold">No {activeTab} hospitals</p>
            <p className="text-slate-400 text-sm mt-1">
              {activeTab === 'pending' ? 'No hospitals waiting for review.' : `No hospitals in ${activeTab} state.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-xs font-semibold uppercase tracking-wide">
                  <th className="text-left px-6 py-3.5">Hospital</th>
                  <th className="text-left px-6 py-3.5">Email</th>
                  <th className="text-left px-6 py-3.5">Phone</th>
                  <th className="text-left px-6 py-3.5">License</th>
                  <th className="text-left px-6 py-3.5">Status</th>
                  <th className="text-left px-6 py-3.5">Registered</th>
                  {activeTab === 'pending' && <th className="text-right px-6 py-3.5">Actions</th>}
                  {activeTab === 'rejected' && <th className="text-left px-6 py-3.5">Reason</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {hospitals.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{h.hospital_name}</div>
                      <div className="text-slate-400 text-xs mt-0.5 max-w-[180px] truncate">{h.address}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{h.email}</td>
                    <td className="px-6 py-4 text-slate-600">{h.phone}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">{h.license_number}</td>
                    <td className="px-6 py-4"><StatusBadge status={h.status} /></td>
                    <td className="px-6 py-4 text-slate-400 text-xs">
                      {new Date(h.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    {activeTab === 'pending' && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(h)}
                            disabled={actionId === h.id}
                            className="text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionId === h.id ? '…' : '✅ Approve'}
                          </button>
                          <button
                            onClick={() => setRejectTarget(h)}
                            disabled={actionId === h.id}
                            className="text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      </td>
                    )}
                    {activeTab === 'rejected' && (
                      <td className="px-6 py-4 text-slate-400 text-xs max-w-[200px]">
                        {h.rejection_reason || '—'}
                      </td>
                    )}
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

export default HospitalApprovalsPage;