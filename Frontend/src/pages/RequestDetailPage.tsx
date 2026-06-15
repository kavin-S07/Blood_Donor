import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hospitalService } from '../services/hospitalService';
import type { BloodRequest, AcceptedDonor } from '../types/donor';
import { EMERGENCY_LEVELS } from '../types/donor';

const urgencyConfig: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border border-red-200',
  high:     'bg-orange-100 text-orange-700 border border-orange-200',
  medium:   'bg-amber-100 text-amber-700 border border-amber-200',
  low:      'bg-green-100 text-green-700 border border-green-200',
};

const statusConfig: Record<string, { cls: string; label: string }> = {
  accepted:          { cls: 'bg-blue-50 text-blue-600',   label: 'Accepted' },
  donated:           { cls: 'bg-green-50 text-green-600', label: 'Donated ✓' },
  rejected:          { cls: 'bg-red-50 text-red-500',     label: 'Rejected' },
  pending:           { cls: 'bg-slate-50 text-slate-400', label: 'Pending' },
};

const REJECTION_REASONS = [
  'Low Hemoglobin',
  'Medical Issue',
  'Incorrect Blood Group',
  'High Blood Pressure',
  'Recent Illness',
  'Other',
];

interface RejectModalProps {
  donorName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  loading: boolean;
}

const RejectModal: React.FC<RejectModalProps> = ({ donorName, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  const [custom, setCustom] = useState('');

  const finalReason = reason === 'Other' ? custom.trim() : reason;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-slate-900 font-bold text-lg mb-1">Reject Donor</h3>
        <p className="text-slate-500 text-sm mb-5">
          Select a rejection reason for <span className="font-semibold text-slate-700">{donorName}</span>
        </p>
        <div className="space-y-2 mb-4">
          {REJECTION_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm border transition-all ${
                reason === r
                  ? 'bg-rose-50 border-rose-300 text-rose-700 font-medium'
                  : 'border-slate-100 text-slate-600 hover:border-rose-200 hover:bg-rose-50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        {reason === 'Other' && (
          <input
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-rose-400"
            placeholder="Enter custom reason..."
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
          />
        )}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 border border-slate-200 text-slate-500 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!finalReason || loading}
            onClick={() => onConfirm(finalReason)}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
          >
            {loading ? 'Rejecting…' : 'Confirm Reject'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface DonateModalProps {
  donorName: string;
  bloodGroup: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}

const DonateModal: React.FC<DonateModalProps> = ({ donorName, bloodGroup, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
      <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">🩸</div>
      <h3 className="text-slate-900 font-bold text-lg mb-2">Confirm Donation</h3>
      <p className="text-slate-500 text-sm mb-1">
        Mark <span className="font-semibold text-slate-700">{donorName}</span> as having donated?
      </p>
      <p className="text-rose-600 font-bold text-base mb-5">{bloodGroup}</p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 border border-slate-200 text-slate-500 py-2.5 rounded-xl text-sm hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          {loading ? 'Saving…' : '✓ Confirm Donated'}
        </button>
      </div>
    </div>
  </div>
);

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [donors, setDonors] = useState<AcceptedDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ status: '', emergency_level: '', units_needed: '' });
  const [saving, setSaving] = useState(false);

  // Modal state
  const [donateModal, setDonateModal] = useState<AcceptedDonor | null>(null);
  const [rejectModal, setRejectModal] = useState<AcceptedDonor | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const [req, acceptedDonors] = await Promise.all([
        hospitalService.getRequestById(Number(id)),
        hospitalService.getAcceptedDonors(Number(id)),
      ]);
      setRequest(req);
      setDonors(Array.isArray(acceptedDonors) ? acceptedDonors : []);
      setEditForm({
        status: req.status,
        emergency_level: req.emergency_level,
        units_needed: String(req.units_needed),
      });
    } catch {
      navigate('/hospital');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await hospitalService.updateRequest(Number(id), {
        status: editForm.status,
        emergency_level: editForm.emergency_level,
        units_needed: parseInt(editForm.units_needed),
      });
      setRequest((r) => r ? { ...r, ...editForm, units_needed: parseInt(editForm.units_needed) } as BloodRequest : r);
      setEditing(false);
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleMarkDonated = async () => {
    if (!donateModal) return;
    setActionLoading(true);
    try {
      await hospitalService.markDonated(Number(id), donateModal.response_id);
      setDonors((prev) =>
        prev.map((d) =>
          d.response_id === donateModal.response_id
            ? { ...d, acceptance_status: 'donated', donated_at: new Date().toISOString() }
            : d
        )
      );
      // Refresh request to get updated units_received
      const updatedReq = await hospitalService.getRequestById(Number(id));
      setRequest(updatedReq);
      setDonateModal(null);
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const handleRejectDonor = async (reason: string) => {
    if (!rejectModal) return;
    setActionLoading(true);
    try {
      await hospitalService.rejectDonor(Number(id), rejectModal.response_id, reason);
      setDonors((prev) =>
        prev.map((d) =>
          d.response_id === rejectModal.response_id
            ? { ...d, acceptance_status: 'rejected', rejection_reason: reason }
            : d
        )
      );
      setRejectModal(null);
    } catch {} finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!request) return null;

  const inputCls = 'bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500';
  const reqStatusConfig: Record<string, string> = {
    pending:            'text-amber-600 bg-amber-50',
    accepted:           'text-blue-600 bg-blue-50',
    completed:          'text-green-600 bg-green-50',
    partially_completed:'text-orange-600 bg-orange-50',
    cancelled:          'text-slate-400 bg-slate-50',
  };

  return (
    <>
      {donateModal && (
        <DonateModal
          donorName={donateModal.name}
          bloodGroup={donateModal.blood_group}
          onConfirm={handleMarkDonated}
          onCancel={() => setDonateModal(null)}
          loading={actionLoading}
        />
      )}
      {rejectModal && (
        <RejectModal
          donorName={rejectModal.name}
          onConfirm={handleRejectDonor}
          onCancel={() => setRejectModal(null)}
          loading={actionLoading}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 py-8">
        <button onClick={() => navigate('/hospital')} className="text-slate-400 hover:text-slate-900 text-sm mb-6 flex items-center gap-1">
          ← Back to dashboard
        </button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Request details */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-900 font-semibold">Request Details</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="text-xs text-rose-600 hover:text-rose-500 border border-slate-200 px-3 py-1 rounded transition-colors">
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Status</label>
                  <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className={`w-full ${inputCls}`}>
                    {['pending', 'accepted', 'completed', 'partially_completed', 'cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Emergency Level</label>
                  <select value={editForm.emergency_level} onChange={(e) => setEditForm((f) => ({ ...f, emergency_level: e.target.value }))} className={`w-full ${inputCls}`}>
                    {EMERGENCY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 text-xs mb-1 block">Units Needed</label>
                  <input type="number" min="1" value={editForm.units_needed} onChange={(e) => setEditForm((f) => ({ ...f, units_needed: e.target.value }))} className={`w-full ${inputCls}`} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setEditing(false)} className="flex-1 border border-slate-200 text-slate-400 py-2 rounded-lg text-sm transition-colors hover:text-slate-900">Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-sm transition-colors font-semibold">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Blood Group', value: request.blood_group },
                  { label: 'Units Needed', value: request.units_needed },
                  { label: 'Units Received', value: request.units_received ?? 0 },
                  { label: 'Location', value: request.location },
                  { label: 'Description', value: request.description || '—' },
                  { label: 'Created', value: new Date(request.created_at).toLocaleString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="text-slate-900 max-w-[55%] text-right">{String(value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-400">Urgency</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize ${urgencyConfig[request.emergency_level]}`}>
                    {request.emergency_level}
                  </span>
                </div>
                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-400">Status</span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full capitalize font-semibold ${reqStatusConfig[request.status] || 'text-slate-500 bg-slate-50'}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                </div>
                {/* Progress bar */}
                {(request.units_received ?? 0) > 0 && (
                  <div className="pt-2">
                    <div className="flex justify-between text-xs text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{request.units_received}/{request.units_needed} units</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, ((request.units_received ?? 0) / request.units_needed) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Accepted Donors */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="text-slate-900 font-semibold mb-5">
              Accepted Donors ({donors.length})
            </h2>
            {donors.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-slate-400 text-sm">No donors have accepted yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {donors.map((d) => {
                  const sc = statusConfig[d.acceptance_status] || statusConfig.pending;
                  const isDonated  = d.acceptance_status === 'donated';
                  const isRejected = d.acceptance_status === 'rejected';
                  const canAct     = !isDonated && !isRejected;

                  return (
                    <div key={d.response_id} className={`border rounded-xl px-4 py-3 transition-all ${isDonated ? 'border-green-200 bg-green-50' : isRejected ? 'border-red-100 bg-red-50' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-slate-900 text-sm font-medium">{d.name}</div>
                          <div className="text-slate-400 text-xs mt-0.5 truncate">{d.phone} · {d.city || 'N/A'}</div>
                          <div className="text-slate-400 text-xs mt-0.5">
                            Accepted {new Date(d.response_date).toLocaleDateString()}
                          </div>
                          {isDonated && d.donated_at && (
                            <div className="text-green-600 text-xs mt-0.5">
                              Donated {new Date(d.donated_at).toLocaleDateString()}
                            </div>
                          )}
                          {isRejected && d.rejection_reason && (
                            <div className="text-red-500 text-xs mt-0.5">Reason: {d.rejection_reason}</div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-rose-600 font-bold text-sm">{d.blood_group}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sc.cls}`}>
                            {sc.label}
                          </span>
                        </div>
                      </div>

                      {canAct && (
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => setDonateModal(d)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors"
                          >
                            ✓ Mark Donated
                          </button>
                          <button
                            onClick={() => setRejectModal(d)}
                            className="flex-1 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold py-1.5 rounded-lg transition-colors"
                          >
                            ✗ Reject
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestDetailPage;
