import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const donorIcon = new L.DivIcon({
  html: '<div style="background:#2563eb;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🩸</div>',
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const hospitalIcon = new L.DivIcon({
  html: '<div style="background:#be123c;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏥</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface FitBoundsProps {
  donorPosition: LatLng;
  hospitalPosition: LatLng;
}

// Automatically fits both markers (and the route) within the viewport
// whenever either position changes.
const FitBounds: React.FC<FitBoundsProps> = ({ donorPosition, hospitalPosition }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(
      [donorPosition.lat, donorPosition.lng],
      [hospitalPosition.lat, hospitalPosition.lng]
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
  }, [map, donorPosition.lat, donorPosition.lng, hospitalPosition.lat, hospitalPosition.lng]);

  return null;
};

export interface NavigationMapProps {
  donorPosition: LatLng;
  hospitalPosition: LatLng;
  /** Decoded OSRM route geometry as [lat, lng] pairs, road-snapped */
  geometry?: [number, number][];
  hospitalName?: string;
  hospitalAddress?: string;
  donorLabel?: string;
  height?: string;
}

const NavigationMap: React.FC<NavigationMapProps> = ({
  donorPosition,
  hospitalPosition,
  geometry,
  hospitalName = 'Hospital',
  hospitalAddress,
  donorLabel = 'Your Location',
  height = '400px',
}) => {
  return (
    <div className="relative isolate" style={{ height, width: '100%' }}>
      <MapContainer
        center={[donorPosition.lat, donorPosition.lng]}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geometry && geometry.length > 1 && (
          <Polyline
            positions={geometry}
            pathOptions={{ color: '#be123c', weight: 5, opacity: 0.8 }}
          />
        )}

        <Marker position={[hospitalPosition.lat, hospitalPosition.lng]} icon={hospitalIcon}>
          <Popup>
            <div className="text-sm">
              <div className="font-medium">{hospitalName}</div>
              {hospitalAddress && <div className="text-xs text-slate-500">{hospitalAddress}</div>}
            </div>
          </Popup>
        </Marker>

        <Marker position={[donorPosition.lat, donorPosition.lng]} icon={donorIcon}>
          <Popup>
            <div className="text-sm font-medium">{donorLabel}</div>
          </Popup>
        </Marker>

        <FitBounds donorPosition={donorPosition} hospitalPosition={hospitalPosition} />
      </MapContainer>
    </div>
  );
};

export default NavigationMap;