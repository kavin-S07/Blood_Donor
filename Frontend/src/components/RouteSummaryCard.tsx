import React from 'react';

export interface RouteSummaryCardProps {
  distance: string;
  duration: string;
  estimatedArrival: string; // ISO timestamp
  loading?: boolean;
}

const formatArrival = (iso: string): string => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

const RouteSummaryCard: React.FC<RouteSummaryCardProps> = ({
  distance,
  duration,
  estimatedArrival,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="px-4 py-4 bg-slate-50 border-t border-slate-100 animate-pulse">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div className="h-3 w-14 bg-slate-200 rounded mx-auto mb-2" />
              <div className="h-5 w-16 bg-slate-200 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 bg-slate-50 border-t border-slate-100">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-slate-400">Distance</p>
          <p className="text-lg font-bold text-slate-900">{distance}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">ETA</p>
          <p className="text-lg font-bold text-slate-900">{duration}</p>
        </div>
        <div>
          <p className="text-xs text-slate-400">Arrival Time</p>
          <p className="text-lg font-bold text-blue-600">{formatArrival(estimatedArrival)}</p>
        </div>
      </div>
    </div>
  );
};

export default RouteSummaryCard;