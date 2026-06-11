import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hospitalService } from '../services/hospitalService';
import type { BloodRequest, AcceptedDonor } from '../types/donor';
import { EMERGENCY_LEVELS } from '../types/donor';

const urgencyConfig: Record<string, string> = {
  critical: 'bg-red-900/60 text-rose-500 border border-red-700',
  high: 'bg-orange-900/60 text-orange-300 border border-orange-700',
  medium: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
  low: 'bg-green-900/60 text-green-300 border border-green-700',
};

const RequestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [donors, setDonors] = useState<AcceptedDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ status: '', emergency_level: '', units_needed: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
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
    };
    load();
  }, [id, navigate]);

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

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!request) return null;

  const inputCls = 'bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500';

  return (
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
                  {['pending', 'accepted', 'completed', 'cancelled'].map((s) => (
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
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-rose-600 hover:bg-rose-700 text-slate-900 py-2 rounded-lg text-sm transition-colors font-semibold">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { label: 'Blood Group', value: request.blood_group },
                { label: 'Units Needed', value: request.units_needed },
                { label: 'Location', value: request.location },
                { label: 'Status', value: request.status },
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
                <span className={`text-xs px-2.5 py-0.5 rounded-full ${urgencyConfig[request.emergency_level]}`}>
                  {request.emergency_level}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Accepted Donors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="text-slate-900 font-semibold mb-5">Accepted Donors ({donors.length})</h2>
          {donors.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-3xl mb-2">👥</div>
              <p className="text-slate-400 text-sm">No donors have accepted yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {donors.map((d) => (
                <div key={d.donor_id} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-slate-900 text-sm font-medium">{d.name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{d.phone} · {d.city || 'Location N/A'}</div>
                    </div>
                    <div className="text-rose-600 font-bold text-sm">{d.blood_group}</div>
                  </div>
                  <div className="text-slate-500 text-xs mt-1.5">
                    Accepted {new Date(d.response_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestDetailPage;