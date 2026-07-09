import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { NearestDonor, NotifyScope } from '../types/donor';
import DonorProfileModal from './DonorProfileModal';

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const hospitalIcon = new L.DivIcon({
  html: '<div style="background:#be123c;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏥</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const donorIcon = (rank: number) => new L.DivIcon({
  html: `<div style="background:#2563eb;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">${rank}</div>`,
  className: '',
  iconSize: [26, 26],
  iconAnchor: [13, 26],
  popupAnchor: [0, -26],
});

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

const DonorAvatar: React.FC<{ donor: NearestDonor; size?: number }> = ({ donor, size = 40 }) => {
  if (donor.profile_photo_url) {
    return (
      <img
        src={donor.profile_photo_url}
        alt={donor.name}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(donor.name)}
    </div>
  );
};

interface NearestDonorsPanelProps {
  donors: NearestDonor[];
  loading: boolean;
  error?: string | null;
  hospitalCoords?: { lat: number; lng: number } | null;
  routingUnavailable?: number;
  showMap?: boolean;
  loadingMessages?: string[];
  showNotifyActions?: boolean;
  notifyingScope?: NotifyScope | null;
  notifyResult?: string | null;
  onNotify?: (scope: NotifyScope) => void;
  emptyMessage?: string;
}

const NearestDonorsPanel: React.FC<NearestDonorsPanelProps> = ({
  donors,
  loading,
  error,
  hospitalCoords,
  routingUnavailable = 0,
  showMap = true,
  showNotifyActions = false,
  notifyingScope = null,
  notifyResult = null,
  onNotify,
  emptyMessage = 'No nearby eligible donors found right now.',
}) => {
  const [profileDonor, setProfileDonor] = useState<NearestDonor | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-14">
        <div className="w-7 h-7 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-slate-500 text-sm">Calculating road distances via OSRM…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 px-4">
        <div className="text-3xl mb-2">⚠️</div>
        <p className="text-slate-600 font-medium text-sm">{error}</p>
        <p className="text-slate-400 text-xs mt-1">Routing service may be temporarily unavailable — please try again shortly.</p>
      </div>
    );
  }

  return (
    <div>
      {showNotifyActions && onNotify && (
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="text-xs text-slate-400 mr-1">Notify:</span>
          {(['top5', 'top10', 'all'] as NotifyScope[]).map((scope) => (
            <button
              key={scope}
              onClick={() => onNotify(scope)}
              disabled={notifyingScope !== null}
              className="text-xs font-semibold px-3 py-1.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 transition-colors"
            >
              {notifyingScope === scope ? 'Sending…' : scope === 'top5' ? 'Top 5 Donors' : scope === 'top10' ? 'Top 10 Donors' : 'All Compatible Donors'}
            </button>
          ))}
          {notifyResult && <span className="text-xs text-green-600 font-medium ml-1">{notifyResult}</span>}
        </div>
      )}

      {showMap && hospitalCoords && donors.length > 0 && (
        <div className="relative isolate rounded-xl overflow-hidden border border-slate-200 mb-5" style={{ height: 320 }}>
          <MapContainer center={[hospitalCoords.lat, hospitalCoords.lng]} zoom={12} style={{ width: '100%', height: 320 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[hospitalCoords.lat, hospitalCoords.lng]} icon={hospitalIcon}>
              <Popup><div className="text-sm font-medium">Your Hospital</div></Popup>
            </Marker>
            {donors.filter(d => d.latitude != null && d.longitude != null).map((d, idx) => (
              <Marker key={d.donor_id} position={[d.latitude as number, d.longitude as number]} icon={donorIcon(idx + 1)}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-medium">{d.name} · {d.blood_group}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {d.distance_km != null ? `${d.distance_km} km road distance` : 'Distance unavailable'}
                      {d.duration_min != null ? ` · ~${d.duration_min} min ETA` : ''}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {donors.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-3xl mb-2">👥</div>
          <p className="text-slate-500 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {donors.map((d, idx) => (
            <div key={d.donor_id} className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <DonorAvatar donor={d} />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{d.name}</div>
                  <div className="text-xs text-slate-400 truncate">
                    {d.phone} {d.city ? `· ${d.city}` : ''}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${d.availability ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                      {d.availability ? 'Available' : 'Unavailable'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${d.eligible_for_donation ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {d.eligible_for_donation ? 'Eligible' : 'In Cooldown'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-rose-600 font-bold text-sm">{d.blood_group}</div>
                <div className="text-sm font-semibold text-slate-900 mt-1">
                  {d.distance_km != null ? `${d.distance_km} km` : '—'}
                </div>
                <div className="text-xs text-slate-400">
                  {d.duration_min != null ? `~${d.duration_min} min` : ''}
                </div>
                <button
                  onClick={() => setProfileDonor(d)}
                  className="mt-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:border-rose-400 px-2.5 py-1 rounded-lg transition-colors"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {routingUnavailable > 0 && (
        <p className="text-xs text-amber-600 mt-4">
          ⚠️ {routingUnavailable} compatible donor(s) were excluded — road route could not be calculated.
        </p>
      )}

      {profileDonor && (
        <DonorProfileModal donor={profileDonor} onClose={() => setProfileDonor(null)} />
      )}
    </div>
  );
};

export default NearestDonorsPanel;
