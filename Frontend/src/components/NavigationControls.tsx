import React from 'react';

export interface NavigationControlsProps {
  donorPosition?: { lat: number; lng: number } | null;
  hospitalPosition: { lat: number; lng: number };

  // Accept / Reject — only rendered when their handlers are supplied
  onAccept?: () => void;
  onReject?: () => void;
  acceptRejectLoading?: boolean;

  // In-app navigation
  onStartNavigation?: () => void;
  navigationActive?: boolean;

  // Manual route refresh
  onRefreshRoute?: () => void;
  refreshing?: boolean;
}

const buildGoogleMapsUrl = (hospitalLat: number, hospitalLng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${hospitalLat},${hospitalLng}&travelmode=driving`;

const buildOsmUrl = (
  donorPosition: { lat: number; lng: number } | null | undefined,
  hospitalLat: number,
  hospitalLng: number
): string => {
  if (donorPosition) {
    return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&route=${donorPosition.lat}%2C${donorPosition.lng}%3B${hospitalLat}%2C${hospitalLng}`;
  }
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_car&to=${hospitalLat}%2C${hospitalLng}`;
};

const NavigationControls: React.FC<NavigationControlsProps> = ({
  donorPosition,
  hospitalPosition,
  onAccept,
  onReject,
  acceptRejectLoading = false,
  onStartNavigation,
  navigationActive = false,
  onRefreshRoute,
  refreshing = false,
}) => {
  const showAcceptReject = !!(onAccept || onReject);

  return (
    <div className="p-4 border-t border-slate-100 space-y-3">
      {showAcceptReject && (
        <div className="flex gap-2">
          {onAccept && (
            <button
              onClick={onAccept}
              disabled={acceptRejectLoading}
              className="flex-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              {acceptRejectLoading ? '…' : 'Accept Request'}
            </button>
          )}
          {onReject && (
            <button
              onClick={onReject}
              disabled={acceptRejectLoading}
              className="flex-1 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Reject Request
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {onStartNavigation && (
          <button
            onClick={onStartNavigation}
            className="flex-1 min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            {navigationActive ? '🧭 Navigating…' : '🧭 Start Navigation'}
          </button>
        )}
        {onRefreshRoute && (
          <button
            onClick={onRefreshRoute}
            disabled={refreshing}
            className="flex-1 min-w-[140px] border border-slate-200 hover:border-slate-300 disabled:opacity-60 text-slate-600 hover:text-slate-800 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing…' : 'Refresh Route'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={buildGoogleMapsUrl(hospitalPosition.lat, hospitalPosition.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[140px] text-center border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-medium px-4 py-2 rounded-xl transition-colors"
        >
          Open in Google Maps ↗
        </a>
        <a
          href={buildOsmUrl(donorPosition, hospitalPosition.lat, hospitalPosition.lng)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 min-w-[140px] text-center border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-medium px-4 py-2 rounded-xl transition-colors"
        >
          Open in OpenStreetMap ↗
        </a>
      </div>
    </div>
  );
};

export default NavigationControls;