import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalService } from '../services/hospitalService';
import { BLOOD_GROUPS, EMERGENCY_LEVELS } from '../types/donor';

const CreateBloodRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    blood_group: '',
    units_needed: '',
    location: '',
    emergency_level: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await hospitalService.createRequest({
        blood_group: form.blood_group,
        units_needed: parseInt(form.units_needed),
        location: form.location,
        emergency_level: form.emergency_level,
        description: form.description || undefined,
      });
      navigate('/hospital');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors';

  const urgencyDescriptions: Record<string, string> = {
    critical: 'Life-threatening — immediate donor needed',
    high: 'Urgent — within hours',
    medium: 'Within 24–48 hours',
    low: 'Planned procedure / non-urgent',
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Create Blood Request</h1>
        <p className="text-slate-400 text-sm mt-1">Compatible donors will be notified automatically</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-rose-500 text-sm px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-slate-500 text-sm mb-1.5">Blood Group *</label>
              <select value={form.blood_group} onChange={set('blood_group')} required className={inputCls}>
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-slate-500 text-sm mb-1.5">Units Needed *</label>
              <input
                type="number"
                min="1"
                value={form.units_needed}
                onChange={set('units_needed')}
                required
                className={inputCls}
                placeholder="e.g. 2"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-500 text-sm mb-1.5">Location *</label>
            <input
              value={form.location}
              onChange={set('location')}
              required
              className={inputCls}
              placeholder="Hospital name and address"
            />
          </div>

          <div>
            <label className="block text-slate-500 text-sm mb-1.5">Emergency Level *</label>
            <select value={form.emergency_level} onChange={set('emergency_level')} required className={inputCls}>
              <option value="">Select urgency</option>
              {EMERGENCY_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {l.charAt(0).toUpperCase() + l.slice(1)} — {urgencyDescriptions[l]}
                </option>
              ))}
            </select>
            {form.emergency_level && (
              <p className="text-slate-400 text-xs mt-1.5">{urgencyDescriptions[form.emergency_level]}</p>
            )}
          </div>

          {/* Visual urgency hint */}
          {form.emergency_level === 'critical' && (
            <div className="bg-red-950/30 border border-red-200 rounded-xl px-4 py-3 text-rose-500 text-sm">
              ⚠️ Critical requests will immediately notify all compatible donors in the system.
            </div>
          )}

          <div>
            <label className="block text-slate-500 text-sm mb-1.5">Additional Notes</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Provide any additional context…"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/hospital')}
              className="flex-1 border border-slate-200 text-slate-400 hover:text-slate-900 py-2.5 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-slate-900 font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Creating…' : 'Create & Notify Donors'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBloodRequestPage;