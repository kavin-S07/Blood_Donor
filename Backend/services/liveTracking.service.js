const db = require('../config/db');
const liveLocationRepo = require('../repositories/liveLocation.repository');
const requestRepo = require('../repositories/bloodRequest.repository');
const osrmSvc = require('./osrm.service');

const ARRIVAL_THRESHOLD_KM = 0.1;

const processLocationUpdate = async (userId, requestId, latitude, longitude, speed, heading, accuracy) => {
    const location = await liveLocationRepo.upsert(userId, requestId, latitude, longitude, speed, heading, accuracy);

    const request = await requestRepo.findById(requestId);
    if (!request) return { location, arrived: false };

    const hospitalLat = request.hospital_latitude;
    const hospitalLng = request.hospital_longitude;

    let arrived = false;
    if (hospitalLat != null && hospitalLng != null) {
        const distance = osrmSvc.getDistanceBetween(latitude, longitude, hospitalLat, hospitalLng);
        if (distance <= ARRIVAL_THRESHOLD_KM) {
            arrived = true;
            await requestRepo.updateStatus(requestId, 'arrived');
            await liveLocationRepo.deleteByRequestAndUser(requestId, userId);
        }
    }

    return { location, arrived, request };
};

const getLiveLocation = async (requestId) => {
    const locations = await liveLocationRepo.findByRequestId(requestId);
    return locations.length > 0 ? locations[0] : null;
};

const getTrackingInfo = async (requestId) => {
    const request = await requestRepo.findById(requestId);
    if (!request) return null;

    const locations = await liveLocationRepo.findByRequestId(requestId);
    const currentLocation = locations.length > 0 ? locations[0] : null;

    let remainingDistance = null;
    let eta = null;
    let routeSummary = null;

    if (currentLocation && request.hospital_latitude && request.hospital_longitude) {
        const straightLine = osrmSvc.getDistanceBetween(
            currentLocation.latitude, currentLocation.longitude,
            request.hospital_latitude, request.hospital_longitude
        );
        remainingDistance = Math.round(straightLine * 10) / 10;

        try {
            const route = await osrmSvc.getRoute(
                currentLocation.latitude, currentLocation.longitude,
                request.hospital_latitude, request.hospital_longitude
            );
            if (route) {
                remainingDistance = route.distance_km;
                eta = route.duration_min;
                routeSummary = { distance_km: route.distance_km, duration_min: route.duration_min };
            }
        } catch (_) {
            // fallback to straight-line distance
        }
    }

    return {
        hospital: {
            id: request.hospital_id,
            name: request.hospital_name,
            address: request.hospital_address || request.location,
            contact_number: request.contact_number,
            latitude: request.hospital_latitude,
            longitude: request.hospital_longitude,
        },
        donor: currentLocation ? {
            id: currentLocation.user_id,
            name: currentLocation.user_name,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            speed: currentLocation.speed,
            heading: currentLocation.heading,
            accuracy: currentLocation.accuracy,
            updatedAt: currentLocation.updated_at,
        } : null,
        request: {
            id: request.id,
            blood_group: request.blood_group,
            units_needed: request.units_needed,
            emergency_level: request.emergency_level,
            status: request.status,
        },
        remaining_distance_km: remainingDistance,
        eta_min: eta,
        route_summary: routeSummary,
    };
};

module.exports = { processLocationUpdate, getLiveLocation, getTrackingInfo };
