import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { donorService } from '../services/donorService';
import { navigationService } from '../services/navigationService';
import { osrmService } from '../services/locationService';
import { startTrackingDonor, updateDonorLocation, sendLiveLocation } from '../services/socketService';
import type { NavigationRoute } from '../types/donor';
import NavigationMap from '../components/NavigationMap';
import RouteSummaryCard from '../components/RouteSummaryCard';
import HospitalInfoCard from '../components/HospitalInfoCard';
import NavigationControls from '../components/NavigationControls';

const getCurrentPositionAsync = (): Promise<GeolocationPosition> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    });
  });

const geoErrorMessage = (err: unknown): string => {
  const code = (err as GeolocationPositionError)?.code;
  if (code === 1) return 'Location permission denied. Please enable GPS access to navigate.';
  if (code === 2) return 'Unable to determine your current location. Please try again.';
  if (code === 3) return 'Location request timed out. Please try again.';
  return 'Unable to determine your current location. Please try again.';
};

const routeErrorMessage = (err: unknown): string => {
  const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
  const serverMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
  if (status === 503) return 'The routing service is temporarily unavailable. Please try again shortly.';
  if (status === 422) return 'No valid driving route could be found to the hospital.';
  return serverMessage || 'Failed to load the navigation route. Please try again.';
};

const DonorNavigationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeRequest, setActiveRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number; heading?: number; speed?: number; accuracy?: number } | null>(null);
  const [liveRouteInfo, setLiveRouteInfo] = useState<{ distance_km: number; duration_min: number } | null>(null);
  const [arrived, setArrived] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const liveIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const [navigationStarted, setNavigationStarted] = useState(false);
  const [routeData, setRouteData] = useState<NavigationRoute | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const req = await donorService.getActiveRequest();
        setActiveRequest(req);
        if (req && req.hospital_latitude && req.hospital_longitude) {
          startTrackingDonor(req.id);
          getCurrentPositionAndTrack(req);
          startLiveTracking(req);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    };
  }, []);

  const getCurrentPositionAndTrack = (req: any) => {
    if (!navigator.geolocation) return;

    const update = () => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCurrentPos({ lat, lng });
          updateDonorLocation(lat, lng);

          const dist = await osrmService.getRoute(
            lat, lng,
            req.hospital_latitude, req.hospital_longitude
          );
          if (dist) {
            setLiveRouteInfo(dist);
            if (dist.distance_km < 0.1) {
              setArrived(true);
              if (intervalRef.current) clearInterval(intervalRef.current);
              if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
            }
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    update();
    intervalRef.current = setInterval(update, 5000);
  };

  const startLiveTracking = (req: any) => {
    if (!navigator.geolocation) return;

    const sendUpdate = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const heading = pos.coords.heading;
          const speed = pos.coords.speed;
          const accuracy = pos.coords.accuracy;

          setCurrentPos((prev) => ({
            ...prev,
            lat,
            lng,
            heading: heading ?? undefined,
            speed: speed ?? undefined,
            accuracy: accuracy ?? undefined,
          }));

          sendLiveLocation(
            lat,
            lng,
            heading ?? null,
            speed ?? null,
            accuracy ?? null
          );
        },
        (err) => {
          const code = (err as GeolocationPositionError)?.code;
          if (code === 1) console.warn('GPS permission denied for live tracking');
          else if (code === 2) console.warn('GPS unavailable for live tracking');
          else if (code === 3) console.warn('GPS timed out for live tracking');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    sendUpdate();
    liveIntervalRef.current = setInterval(sendUpdate, 5000);
  };

  const fetchRoute = useCallback(async () => {
    if (!activeRequest) return;
    setRouteError(null);
    setRouteLoading(true);
    try {
      const pos = await getCurrentPositionAsync();
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setCurrentPos((prev) => prev ?? { lat, lng });

      const data = await navigationService.getRequestRoute(activeRequest.id, lat, lng);
      setRouteData(data);
    } catch (err) {
      const isGeoError = typeof (err as GeolocationPositionError)?.code === 'number';
      setRouteError(isGeoError ? geoErrorMessage(err) : routeErrorMessage(err));
    } finally {
      setRouteLoading(false);
    }
  }, [activeRequest]);

  const handleStartNavigation = () => {
    setNavigationStarted(true);
    fetchRoute();
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-8 h-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!activeRequest) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-4">🧭</div>
        <h2 className="text-xl font-bold text-slate-900">No Active Navigation</h2>
        <p className="text-slate-500 text-sm mt-2">You don't have any accepted requests to navigate to.</p>
        <button
          onClick={() => navigate('/donor/requests')}
          className="mt-5 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors"
        >
          Browse Requests
        </button>
      </div>
    );
  }

  const hospitalPos = {
    lat: activeRequest.hospital_latitude,
    lng: activeRequest.hospital_longitude,
  };

  const mapDonorPos: { lat: number; lng: number } | null =
    currentPos ??
    (routeData ? { lat: routeData.donor.latitude, lng: routeData.donor.longitude } : null);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🧭 Navigation</h1>
          <p className="text-slate-500 text-sm mt-1">{activeRequest.hospital_name}</p>
        </div>
        <button
          onClick={() => navigate('/donor')}
          className="text-sm text-slate-400 border border-slate-200 px-3 py-1.5 rounded-lg hover:border-slate-300 transition-colors"
        >
          ← Back
        </button>
      </div>

      {arrived && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-2xl px-5 py-4 text-center">
          <div className="text-2xl mb-2">✅</div>
          <h3 className="text-green-800 font-bold text-lg">You Have Arrived!</h3>
          <p className="text-green-600 text-sm mt-1">The hospital has been notified of your arrival.</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {routeData ? (
          <HospitalInfoCard hospital={routeData.hospital} request={routeData.request} />
        ) : (
          <div className="p-4 border-b border-slate-100">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Destination</p>
                <p className="text-sm font-medium text-slate-900">{activeRequest.hospital_name}</p>
                <p className="text-xs text-slate-500">{activeRequest.hospital_address || activeRequest.location}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Blood Needed</p>
                <p className="text-lg font-bold text-rose-600">{activeRequest.blood_group}</p>
              </div>
            </div>
          </div>
        )}

        {!navigationStarted ? (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500 mb-4">
              Start navigation to load the driving route from your current location to the hospital.
            </p>
            <button
              onClick={handleStartNavigation}
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm"
            >
              🧭 Start Navigation
            </button>
          </div>
        ) : (
          <>
            {routeError && (
              <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl">
                ⚠️ {routeError}
              </div>
            )}

            {routeLoading && !routeData ? (
              <div className="flex justify-center py-16">
                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              mapDonorPos && (
                <NavigationMap
                  donorPosition={mapDonorPos}
                  hospitalPosition={hospitalPos}
                  geometry={routeData?.geometry}
                  hospitalName={activeRequest.hospital_name}
                  hospitalAddress={activeRequest.hospital_address || activeRequest.location}
                  donorLabel={currentPos ? 'Your Location — Live' : 'Your Location'}
                />
              )
            )}

            {routeData && (
              <RouteSummaryCard
                distance={routeData.distance}
                duration={routeData.duration}
                estimatedArrival={routeData.estimatedArrival}
                loading={routeLoading}
              />
            )}

            {currentPos && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 space-x-4">
                {currentPos.speed != null && <span>Speed: {(currentPos.speed * 3.6).toFixed(1)} km/h</span>}
                {currentPos.heading != null && <span>Heading: {currentPos.heading.toFixed(0)}°</span>}
                {currentPos.accuracy != null && <span>Accuracy: ±{currentPos.accuracy.toFixed(0)}m</span>}
              </div>
            )}

            <NavigationControls
              donorPosition={currentPos}
              hospitalPosition={hospitalPos}
              onRefreshRoute={fetchRoute}
              refreshing={routeLoading}
              navigationActive
            />
          </>
        )}

        {liveRouteInfo && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
            Live status: {arrived ? 'Arrived' : `${liveRouteInfo.distance_km} km away · ${liveRouteInfo.duration_min} min`}
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorNavigationPage;
