const axios = require('axios');

const OSRM_BASE = 'https://router.project-osrm.org';

const getRoute = async (originLat, originLng, destLat, destLng) => {
    const url = `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=false`;
    const { data } = await axios.get(url, { timeout: 10000 });

    if (!data || data.code !== 'Ok' || !data.routes?.length) {
        return null;
    }

    const route = data.routes[0];
    return {
        distance_km: Math.round((route.distance / 1000) * 10) / 10,
        duration_min: Math.round((route.duration / 60) * 10) / 10,
    };
};

const getDistanceBetween = (lat1, lng1, lat2, lng2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── Additive: caching + batched concurrency-limited lookups ────
// Used by the Smart Nearest Donor Matching feature. Does not alter
// the behaviour of getRoute/getDistanceBetween above.

const routeCache = new Map(); // key -> { data, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const OSRM_CONCURRENCY = 5;          // avoid hammering the public OSRM instance

const roundCoord = (n) => Math.round(n * 10000) / 10000; // ~11m precision, plenty for caching

const buildCacheKey = (lat1, lng1, lat2, lng2) =>
    `${roundCoord(lat1)},${roundCoord(lng1)}->${roundCoord(lat2)},${roundCoord(lng2)}`;

/**
 * Same as getRoute, but caches results for CACHE_TTL_MS so repeated
 * requests (e.g. same donor appearing for multiple hospital requests)
 * don't re-hit the OSRM API.
 */
const getRouteCached = async (originLat, originLng, destLat, destLng) => {
    const key = buildCacheKey(originLat, originLng, destLat, destLng);
    const cached = routeCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }
    const result = await getRoute(originLat, originLng, destLat, destLng);
    routeCache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
};

/**
 * Computes road distance/duration from every donor to a single destination
 * (the hospital), with limited concurrency and per-donor graceful failure
 * handling. Donors without coordinates, or for whom OSRM has no route /
 * errors out, get distance_km: null + a routing_error message instead of
 * falling back to straight-line distance.
 */
const getRoutesForDonorsBatch = async (donors, destLat, destLng) => {
    const results = new Array(donors.length);
    let cursor = 0;

    const worker = async () => {
        while (cursor < donors.length) {
            const i = cursor++;
            const donor = donors[i];

            if (donor.latitude == null || donor.longitude == null) {
                results[i] = { ...donor, distance_km: null, duration_min: null, routing_error: 'Donor location unavailable' };
                continue;
            }

            try {
                const route = await getRouteCached(donor.latitude, donor.longitude, destLat, destLng);
                if (!route) {
                    results[i] = { ...donor, distance_km: null, duration_min: null, routing_error: 'No road route found' };
                } else {
                    results[i] = { ...donor, distance_km: route.distance_km, duration_min: route.duration_min, routing_error: null };
                }
            } catch (err) {
                results[i] = { ...donor, distance_km: null, duration_min: null, routing_error: 'Routing service unavailable' };
            }
        }
    };

    const workerCount = Math.min(OSRM_CONCURRENCY, donors.length) || 1;
    await Promise.all(Array.from({ length: workerCount }, worker));

    return results;
};

// ── Additive: full route (with geometry) for Donor Navigation ──
// Used by the Donor Navigation feature to draw the driving route
// polyline on the map. Does not alter any of the functions above.

/**
 * Fetches a full driving route (distance, duration, and decoded polyline
 * geometry) from OSRM between an origin and a destination.
 *
 * Returns null if OSRM could not find a valid driving route.
 * Throws if the OSRM service itself is unreachable / errors out, so the
 * caller can distinguish "no route" from "service unavailable".
 */
const getFullRoute = async (originLat, originLng, destLat, destLng) => {
    const url = `${OSRM_BASE}/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson`;

    let data;
    try {
        const response = await axios.get(url, { timeout: 10000 });
        data = response.data;
    } catch (err) {
        const serviceError = new Error('OSRM routing service unavailable');
        serviceError.cause = err;
        throw serviceError;
    }

    if (!data || data.code !== 'Ok' || !data.routes?.length) {
        return null;
    }

    const route = data.routes[0];
    // OSRM/GeoJSON coordinates are [lng, lat] — flip to [lat, lng] for Leaflet
    const geometry = (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);

    return {
        distance_km: Math.round((route.distance / 1000) * 10) / 10,
        duration_min: Math.round((route.duration / 60) * 10) / 10,
        geometry,
    };
};

module.exports = {
    getRoute, getDistanceBetween, getRouteCached, getRoutesForDonorsBatch,
    getFullRoute,
};