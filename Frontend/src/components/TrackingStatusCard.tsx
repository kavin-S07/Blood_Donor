import React from 'react';

export interface TrackingStatusCardProps {
  status?: string;
  donorName?: string;
  lastUpdated?: string;
}

const formatTime = (iso?: string): string => {
  if (!iso) return '--';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '--';
  }
};

const statusConfig: Record<string, { label: string; cls: string; icon: string }> = {
  accepted:  { label: 'En Route', cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: '🚗' },
  arrived:   { label: 'Arrived', cls: 'bg-green-50 text-green-700 border-green-200', icon: '✅' },
  completed: { label: 'Completed', cls: 'bg-green-50 text-green-700 border-green-200', icon: '✅' },
  cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-500 border-red-200', icon: '❌' },
};

const TrackingStatusCard: React.FC<TrackingStatusCardProps> = ({
  status,
  donorName,
  lastUpdated,
}) => {
  const cfg = statusConfig[status || ''] || { label: status || 'Unknown', cls: 'bg-slate-50 text-slate-500 border-slate-200', icon: '❓' };

  return (
    <div className="px-5 py-4 border-b border-slate-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.icon}</span>
          <div>
            <p className="text-sm font-medium text-slate-900">{cfg.label}</p>
            {donorName && (
              <p className="text-xs text-slate-500">{donorName}</p>
            )}
          </div>
        </div>
        {lastUpdated && (
          <span className="text-xs text-slate-400">{formatTime(lastUpdated)}</span>
        )}
      </div>
    </div>
  );
};

export default TrackingStatusCard;
