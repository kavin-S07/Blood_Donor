import React from 'react';
import type { NearestDonor } from '../types/donor';

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';

interface DonorProfileModalProps {
  donor: NearestDonor;
  onClose: () => void;
}

const DonorProfileModal: React.FC<DonorProfileModalProps> = ({ donor, onClose }) => (
  <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div
      className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-4 mb-5">
        {donor.profile_photo_url ? (
          <img src={donor.profile_photo_url} alt={donor.name} className="w-16 h-16 rounded-full object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-700 font-bold text-xl flex items-center justify-center">
            {initials(donor.name)}
          </div>
        )}
        <div>
          <h3 className="text-slate-900 font-bold text-lg leading-tight">{donor.name}</h3>
          <span className="text-rose-600 font-bold text-sm">{donor.blood_group}</span>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Contact Number</span>
          <a href={`tel:${donor.phone}`} className="text-slate-900 font-medium hover:text-rose-600">{donor.phone}</a>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Location</span>
          <span className="text-slate-900">{[donor.city, donor.state].filter(Boolean).join(', ') || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Road Distance</span>
          <span className="text-slate-900">{donor.distance_km != null ? `${donor.distance_km} km` : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Estimated Travel Time</span>
          <span className="text-slate-900">{donor.duration_min != null ? `~${donor.duration_min} min` : '—'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Availability</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${donor.availability ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
            {donor.availability ? 'Available' : 'Unavailable'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">Eligibility</span>
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${donor.eligible_for_donation ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
            {donor.eligible_for_donation ? 'Eligible to Donate' : 'In Cooldown Period'}
          </span>
        </div>
      </div>

      <div className="flex gap-3 pt-6">
        <a
          href={`tel:${donor.phone}`}
          className="flex-1 text-center bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
        >
          📞 Call Donor
        </a>
        <button
          onClick={onClose}
          className="flex-1 border border-slate-200 text-slate-500 hover:bg-slate-50 py-2.5 rounded-xl text-sm transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default DonorProfileModal;
