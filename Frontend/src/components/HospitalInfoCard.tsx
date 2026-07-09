import React from 'react';
import type { NavigationHospital, NavigationRequestInfo } from '../types/donor';

const urgencyConfig: Record<string, { label: string; cls: string; dot: string }> = {
  critical: { label: 'Critical', cls: 'bg-red-100 text-red-700 border border-red-200', dot: 'bg-red-500' },
  high:     { label: 'High',     cls: 'bg-orange-100 text-orange-700 border border-orange-200', dot: 'bg-orange-500' },
  medium:   { label: 'Medium',   cls: 'bg-amber-100 text-amber-700 border border-amber-200', dot: 'bg-amber-400' },
  low:      { label: 'Low',      cls: 'bg-green-100 text-green-700 border border-green-200', dot: 'bg-green-500' },
};

export interface HospitalInfoCardProps {
  hospital: NavigationHospital;
  request: NavigationRequestInfo;
}

const HospitalInfoCard: React.FC<HospitalInfoCardProps> = ({ hospital, request }) => {
  const urg = urgencyConfig[request.emergency_level] || urgencyConfig.low;

  return (
    <div className="p-4 border-b border-slate-100">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <p className="text-xs text-slate-400">Destination</p>
          <p className="text-sm font-medium text-slate-900">{hospital.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{hospital.address}</p>
          {hospital.contact_number && (
            <a
              href={`tel:${hospital.contact_number}`}
              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-medium mt-1.5"
            >
              📞 {hospital.contact_number}
            </a>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Blood Needed</p>
          <p className="text-lg font-bold text-rose-600">{request.blood_group}</p>
          <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium mt-1 ${urg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
            {urg.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default HospitalInfoCard;