import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import AnimatedDonorMarker from './AnimatedDonorMarker';

const hospitalIcon = new L.DivIcon({
  html: '<div style="background:#be123c;color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏥</div>',
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface LatLng {
  lat: number;
  lng: number;
}

interface FitBoundsProps {
  donorPosition?: LatLng | null;
  hospitalPosition: LatLng;
}

const FitBounds: React.FC<FitBoundsProps> = ({ donorPosition, hospitalPosition }) => {
  const map = useMap();

  useEffect(() => {
    const points: L.LatLng[] = [L.latLng(hospitalPosition.lat, hospitalPosition.lng)];
    if (donorPosition) {
      points.push(L.latLng(donorPosition.lat, donorPosition.lng));
    }
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    } else {
      map.setView([hospitalPosition.lat, hospitalPosition.lng], 13);
    }
  }, [map, donorPosition, hospitalPosition.lat, hospitalPosition.lng]);

  return null;
};

export interface LiveTrackingMapProps {
  hospitalPosition: LatLng;
  donorPosition?: { lat: number; lng: number; heading?: number | null; speed?: number | null } | null;
  geometry?: [number, number][];
  hospitalName?: string;
  hospitalAddress?: string;
  height?: string;
}

const LiveTrackingMap: React.FC<LiveTrackingMapProps> = ({
  hospitalPosition,
  donorPosition,
  geometry,
  hospitalName = 'Hospital',
  hospitalAddress,
  height = '400px',
}) => {
  const center = donorPosition || hospitalPosition;

  return (
    <div className="relative isolate" style={{ height, width: '100%' }}>
      <MapContainer
        center={[center.lat, center.lng]}
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
            pathOptions={{ color: '#2563eb', weight: 4, opacity: 0.7 }}
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

        {donorPosition && (
          <AnimatedDonorMarker
            position={{ lat: donorPosition.lat, lng: donorPosition.lng }}
            heading={donorPosition.heading}
            speed={donorPosition.speed}
            label="Donor — Live"
          />
        )}

        <FitBounds donorPosition={donorPosition} hospitalPosition={hospitalPosition} />
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;
