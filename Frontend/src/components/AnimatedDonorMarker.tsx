import React, { useEffect, useRef } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

const animatedDonorIcon = new L.DivIcon({
  html: '<div style="background:#2563eb;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;border:3px solid white;box-shadow:0 2px 12px rgba(37,99,235,0.5);transition:transform 0.3s;">🩸</div>',
  className: '',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30],
});

export interface AnimatedDonorMarkerProps {
  position: { lat: number; lng: number };
  heading?: number | null;
  speed?: number | null;
  label?: string;
}

const AnimatedDonorMarker: React.FC<AnimatedDonorMarkerProps> = ({
  position,
  heading,
  speed,
  label = 'Donor',
}) => {
  const markerRef = useRef<L.Marker>(null);
  const animRef = useRef<number>();

  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const current = marker.getLatLng();
    const target = L.latLng(position.lat, position.lng);

    if (current.equals(target)) return;

    const startLat = current.lat;
    const startLng = current.lng;
    const endLat = target.lat;
    const endLng = target.lng;
    const duration = 800;
    const startTime = performance.now();

    const animate = (time: number) => {
      const elapsed = time - startTime;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      const lat = startLat + (endLat - startLat) * ease;
      const lng = startLng + (endLng - startLng) * ease;
      marker.setLatLng([lat, lng]);

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [position.lat, position.lng]);

  return (
    <Marker
      ref={markerRef}
      position={[position.lat, position.lng]}
      icon={animatedDonorIcon}
    >
      <Popup>
        <div className="text-sm">
          <div className="font-medium">{label}</div>
          {speed != null && <div className="text-xs text-slate-500">Speed: {speed.toFixed(1)} m/s</div>}
          {heading != null && <div className="text-xs text-slate-500">Heading: {heading.toFixed(0)}°</div>}
        </div>
      </Popup>
    </Marker>
  );
};

export default AnimatedDonorMarker;
