import React from 'react';

export interface RouteProgressCardProps {
  distance?: string;
  duration?: string;
  estimatedArrival?: string;
  currentSpeed?: number | null;
  heading?: number | null;
  loading?: boolean;
}

const formatArrival = (iso?: string): string => {
  if (!iso) return '--:--';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--:--';
  }
};

const RouteProgressCard: React.FC<RouteProgressCardProps> = ({
  distance,
  duration,
  estimatedArrival,
  currentSpeed,
  heading,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="px-5 py-4 border-b border-slate-100 animate-pulse">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-slate-100 rounded-xl" />
          <div className="h-12 bg-slate-100 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 border-b border-slate-100">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400">Distance</p>
          <p className="text-lg font-bold text-slate-900">{distance || '-- km'}</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-xs text-slate-400">ETA</p>
          <p className="text-lg font-bold text-slate-900">{duration || '-- min'}</p>
        </div>
        {estimatedArrival && (
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Arrival Time</p>
            <p className="text-lg font-bold text-blue-600">{formatArrival(estimatedArrival)}</p>
          </div>
        )}
        {currentSpeed != null && (
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <p className="text-xs text-slate-400">Speed</p>
            <p className="text-lg font-bold text-slate-900">{(currentSpeed * 3.6).toFixed(1)} km/h</p>
          </div>
        )}
      </div>
      {heading != null && (
        <div className="mt-2 text-center">
          <span className="text-xs text-slate-400">
            Heading: {heading.toFixed(0)}° {headingToDirection(heading)}
          </span>
        </div>
      )}
    </div>
  );
};

const headingToDirection = (deg: number): string => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
};

export default RouteProgressCard;
