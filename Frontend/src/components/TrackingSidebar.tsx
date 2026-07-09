import React from 'react';
import TrackingStatusCard from './TrackingStatusCard';
import RouteProgressCard from './RouteProgressCard';

export interface TrackingSidebarProps {
  hospitalName: string;
  hospitalAddress: string;
  bloodGroup: string;
  emergencyLevel: string;
  distance?: string;
  duration?: string;
  estimatedArrival?: string;
  currentSpeed?: number | null;
  heading?: number | null;
  lastUpdated?: string;
  donorName?: string;
  status?: string;
  loading?: boolean;
}

const formatTime = (iso?: string): string => {
  if (!iso) return '--:--';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--:--';
  }
};

const TrackingSidebar: React.FC<TrackingSidebarProps> = ({
  hospitalName,
  hospitalAddress,
  bloodGroup,
  emergencyLevel,
  distance,
  duration,
  estimatedArrival,
  currentSpeed,
  heading,
  lastUpdated,
  donorName,
  status,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 space-y-4 animate-pulse">
        <div className="h-5 w-32 bg-slate-200 rounded" />
        <div className="h-4 w-48 bg-slate-200 rounded" />
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="text-slate-900 font-semibold text-lg">{hospitalName}</h3>
        <p className="text-slate-500 text-xs mt-1">{hospitalAddress}</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-rose-600 font-bold text-base">{bloodGroup}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
            emergencyLevel === 'critical' ? 'bg-red-100 text-red-700' :
            emergencyLevel === 'high' ? 'bg-orange-100 text-orange-700' :
            emergencyLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
            'bg-green-100 text-green-700'
          }`}>
            {emergencyLevel}
          </span>
        </div>
      </div>

      <TrackingStatusCard
        status={status}
        donorName={donorName}
        lastUpdated={lastUpdated}
      />

      <RouteProgressCard
        distance={distance}
        duration={duration}
        estimatedArrival={estimatedArrival}
        currentSpeed={currentSpeed}
        heading={heading}
      />

      {lastUpdated && (
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-400">
            Last updated: {formatTime(lastUpdated)}
          </p>
        </div>
      )}
    </div>
  );
};

export default TrackingSidebar;
