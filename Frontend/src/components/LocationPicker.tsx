import React, { useCallback, useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface LocationValue {
  latitude: number;
  longitude: number;
  formatted_address: string;
}

interface LocationPickerProps {
  value?: LocationValue | null;
  onChange: (location: LocationValue) => void;
  defaultCenter?: { lat: number; lng: number };
  height?: number;
  label?: string;
  error?: string;
}

const FALLBACK_CENTER = { lat: 13.0827, lng: 80.2707 };

const NOMINATIM_SEARCH = 'https://nominatim.openstreetmap.org/search';
const NOMINATIM_REVERSE = 'https://nominatim.openstreetmap.org/reverse';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface MapClickHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface MapCenterUpdaterProps {
  center: { lat: number; lng: number };
}

const MapCenterUpdater: React.FC<MapCenterUpdaterProps> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom() < 13 ? 15 : undefined);
  }, [center.lat, center.lng, map]);
  return null;
};

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  defaultCenter = FALLBACK_CENTER,
  height = 320,
  label = 'Location',
  error,
}) => {
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(
    value ? { lat: value.latitude, lng: value.longitude } : null
  );
  const [address, setAddress] = useState(value?.formatted_address || '');
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [localError, setLocalError] = useState('');
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (value) {
      setMarker({ lat: value.latitude, lng: value.longitude });
      setAddress(value.formatted_address);
    }
  }, [value]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `${NOMINATIM_REVERSE}?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      const formatted = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(formatted);
      onChange({ latitude: lat, longitude: lng, formatted_address: formatted });
    } catch {
      const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      setAddress(fallback);
      onChange({ latitude: lat, longitude: lng, formatted_address: fallback });
    }
  }, [onChange]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setMarker({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleMarkerDragEnd = useCallback((e: L.DragEndEvent) => {
    const pos = e.target.getLatLng();
    const lat = pos.lat;
    const lng = pos.lng;
    setMarker({ lat, lng });
    reverseGeocode(lat, lng);
  }, [reverseGeocode]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `${NOMINATIM_SEARCH}?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      );
      const data = await res.json();
      setSearchResults(data);
      setShowResults(true);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(val), 400);
  };

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setMarker({ lat, lng });
    setSearchQuery(result.display_name);
    setAddress(result.display_name);
    setShowResults(false);
    onChange({ latitude: lat, longitude: lng, formatted_address: result.display_name });
  };

  const handleUseCurrentLocation = useCallback(() => {
    setLocalError('');
    if (!navigator.geolocation) {
      setLocalError('Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMarker({ lat, lng });
        reverseGeocode(lat, lng);
        setLocating(false);
      },
      () => {
        setLocalError('Unable to fetch your current location. Please allow location access.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode]);

  const center: { lat: number; lng: number } = marker || defaultCenter;

  return (
    <div className="space-y-3">
      {label && <label className="block text-slate-700 text-sm font-medium">{label}</label>}

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search for a place or address..."
            value={searchQuery}
            onChange={handleSearchInputChange}
            className="w-full bg-white border border-slate-200 text-slate-900 placeholder-slate-400 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all shadow-sm"
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-rose-50 hover:text-rose-700 border-b border-slate-50 last:border-b-0 transition-colors"
                >
                  {result.display_name}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={locating}
          className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors whitespace-nowrap"
        >
          {locating ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8m5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          Use current location
        </button>
      </div>

      <div className="relative isolate rounded-xl overflow-hidden border border-slate-200 shadow-sm" style={{ height }}>
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={marker ? 15 : 5}
          style={{ width: '100%', height }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <MapCenterUpdater center={center} />
          {marker && (
            <Marker
              position={[marker.lat, marker.lng]}
              draggable={true}
              eventHandlers={{ dragend: handleMarkerDragEnd }}
            />
          )}
        </MapContainer>
      </div>

      {address && (
        <div className="flex items-start gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700">
          <span className="text-rose-600 shrink-0">📍</span>
          <span>{address}</span>
        </div>
      )}

      {!marker && (
        <p className="text-slate-400 text-xs">
          Search for a place, drag the marker, or tap the map to set the exact location.
        </p>
      )}

      {(localError || error) && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          <span>!</span> {localError || error}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
