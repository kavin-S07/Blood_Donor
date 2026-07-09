// services/navigation.service.js
//
// Donor Navigation feature.
// Builds the driving route (via OSRM) from a donor's current position to
// the hospital tied to a blood request, plus all the info the navigation
// UI needs (hospital details, ETA, distance, route geometry).
//
// This is purely additive — it does not touch donorMatching.service.js
// or any of the Smart Nearest Donor Matching logic.

const db      = require('../config/db');
const osrmSvc = require('./osrm.service');

/**
 * Confirms the donor has an accepted response for this request.
 * Throws a descriptive error otherwise (caller maps these to HTTP codes).
 */
const assertDonorAcceptedRequest = async (requestId, donorId) => {
    const { rows } = await db.query(
        `SELECT status FROM request_responses WHERE request_id = $1 AND donor_id = $2`,
        [requestId, donorId]
    );

    if (rows.length === 0) {
        throw new Error('You have not responded to this request');
    }
    if (rows[0].status !== 'accepted' && rows[0].status !== 'donated') {
        throw new Error('You must accept this request before navigation is available');
    }
};

/**
 * Builds the full navigation payload for GET /api/request/:id/route.
 *
 * @param {object} donor      - donor record (from donor.repository.findByUserId)
 * @param {object} request    - blood request record (from bloodRequest.repository.findById)
 * @param {number} donorLat   - donor's current latitude (browser Geolocation API)
 * @param {number} donorLng   - donor's current longitude (browser Geolocation API)
 */
const getRequestRoute = async (donor, request, donorLat, donorLng) => {
    await assertDonorAcceptedRequest(request.id, donor.id);

    const hospitalLat = request.hospital_latitude;
    const hospitalLng = request.hospital_longitude;

    if (hospitalLat == null || hospitalLng == null) {
        throw new Error('Hospital location is not available for this request');
    }

    let route;
    try {
        route = await osrmSvc.getFullRoute(donorLat, donorLng, hospitalLat, hospitalLng);
    } catch (err) {
        const serviceError = new Error('OSRM routing service is currently unavailable');
        serviceError.statusCode = 503;
        throw serviceError;
    }

    if (!route) {
        const noRouteError = new Error('No valid driving route could be found');
        noRouteError.statusCode = 422;
        throw noRouteError;
    }

    const now = new Date();
    const estimatedArrival = new Date(now.getTime() + route.duration_min * 60 * 1000);

    return {
        hospital: {
            id: request.hospital_id,
            name: request.hospital_name,
            address: request.hospital_address,
            contact_number: request.contact_number,
            latitude: hospitalLat,
            longitude: hospitalLng,
        },
        donor: {
            id: donor.id,
            name: donor.name,
            blood_group: donor.blood_group,
            latitude: donorLat,
            longitude: donorLng,
        },
        request: {
            id: request.id,
            blood_group: request.blood_group,
            units_needed: request.units_needed,
            emergency_level: request.emergency_level,
            status: request.status,
        },
        distance: `${route.distance_km} km`,
        distance_km: route.distance_km,
        duration: `${route.duration_min} min`,
        duration_min: route.duration_min,
        estimatedArrival: estimatedArrival.toISOString(),
        geometry: route.geometry,
    };
};

module.exports = { getRequestRoute };