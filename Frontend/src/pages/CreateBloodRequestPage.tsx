import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hospitalService } from '../services/hospitalService';
import { BLOOD_GROUPS, EMERGENCY_LEVELS } from '../types/donor';
import type { NearestDonor, NotifyScope } from '../types/donor';
import LocationPicker, { LocationValue } from '../components/LocationPicker';
import NearestDonorsPanel from '../components/NearestDonorsPanel';

const CreateBloodRequestPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    blood_group: '',
    units_needed: '',
    location: '',
    emergency_level: '',
    description: '',
  });
  const [location, setLocation] = useState<LocationValue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nearestDonors, setNearestDonors] = useState<NearestDonor[]>([]);
  const [routingUnavailable, setRoutingUnavailable] = useState(0);
  const [nearestLoading, setNearestLoading] = useState(false);
  const [nearestMessage, setNearestMessage] = useState<string | null>(null);
  const [showDonors, setShowDonors] = useState(false);
  const [createdRequestId, setCreatedRequestId] = useState<number | null>(null);
  const [hospitalCoords, setHospitalCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [notifyingScope, setNotifyingScope] = useState<NotifyScope | null>(null);
  const [notifyResult, setNotifyResult] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await hospitalService.createRequest({
        blood_group: form.blood_group,
        units_needed: parseInt(form.units_needed),
        location: form.location,
        emergency_level: form.emergency_level,
        description: form.description || undefined,
        pickup_latitude: location?.latitude,
        pickup_longitude: location?.longitude,
      });

      const requestId: number | undefined = result.data?.request?.id;

      if (requestId) {
        setCreatedRequestId(requestId);
        setShowDonors(true);

        // Seed with whatever createRequest already computed, then refresh
        // via the dedicated Smart Nearest Donor Matching endpoint for the
        // richer (availability / eligibility) shape.
        setNearestDonors(result.data?.nearest_donors || []);
        if (result.data?.request?.hospital_latitude && result.data?.request?.hospital_longitude) {
          setHospitalCoords({
            lat: result.data.request.hospital_latitude,
            lng: result.data.request.hospital_longitude,
          });
        }

        setNearestLoading(true);
        try {
          const nearest = await hospitalService.getNearestDonorsForRequest(requestId, 5);
          setNearestDonors(nearest.donors);
          setRoutingUnavailable(nearest.routing_unavailable);
          setNearestMessage(nearest.message || null);
        } catch {
          // Keep the seeded data from createRequest if the refresh fails
        } finally {
          setNearestLoading(false);
        }
      } else {
        navigate('/hospital');
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  const handleNotify = async (scope: NotifyScope) => {
    if (!createdRequestId) return;
    setNotifyingScope(scope);
    setNotifyResult(null);
    try {
      const res = await hospitalService.notifyDonors(createdRequestId, scope);
      setNotifyResult(`Notified ${res.notified} donor(s)`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setNotifyResult(msg || 'Failed to send notifications');
    } finally {
      setNotifyingScope(null);
    }
  };

  const inputCls = 'w-full bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 transition-colors';

  const urgencyDescriptions: Record<string, string> = {
    critical: 'Life-threatening — immediate donor needed',
    high: 'Urgent — within hours',
    medium: 'Within 24–48 hours',
    low: 'Planned procedure / non-urgent',
  };

  if (showDonors) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Request Created!</h1>
          <p className="text-slate-400 text-sm mt-1">
            {form.blood_group} blood request has been sent. Here are the top nearest compatible donors:
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-slate-900 font-semibold mb-4">Top 5 Nearest Donors</h3>
          <NearestDonorsPanel
            donors={nearestDonors}
            loading={nearestLoading}
            error={nearestMessage}
            hospitalCoords={hospitalCoords}
            routingUnavailable={routingUnavailable}
            showNotifyActions
            notifyingScope={notifyingScope}
            notifyResult={notifyResult}
            onNotify={handleNotify}
            emptyMessage="No nearby donors found with location data. Donors have still been notified."
          />

          <div className="flex gap-3 pt-6">
            <button
              onClick={() => navigate('/hospital')}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          <LocationPicker
            label="Pickup Location (optional — defaults to hospital address)"
            value={location}
            onChange={(loc) => setLocation(loc)}
          />

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
              placeholder="Provide any additional context..."
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
              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
            >
              {loading ? 'Creating...' : 'Create & Notify Donors'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBloodRequestPage;
