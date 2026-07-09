// services/donorMatching.service.js
//
// Smart Nearest Donor Matching.
// Pipeline: compatible blood groups -> available & non-cooldown donors
//           (already filtered in donorRepo.findCompatibleDonors) ->
//           OSRM road distance/ETA (cached, concurrency-limited) ->
//           sort by road distance -> top N.
//
// NOTE: Per spec, straight-line (Haversine) distance is never used for
// the final ranking/result here. If OSRM cannot compute a route for a
// donor, that donor is excluded from the ranked list and counted in
// `routing_unavailable` instead of being silently approximated.

const donorRepo = require('../repositories/donor.repository');
const compatSvc = require('../services/bloodCompatibility.service');
const osrmSvc   = require('../services/osrm.service');
const notifSvc  = require('../services/notification.service');
const db        = require('../config/db');
const { BLOOD_GROUPS } = require('../utils/constants');

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

const isDonorCurrentlyEligible = (donor) => {
    const eligible = donor.eligible_for_donation !== false;
    const nextDate = donor.next_eligible_date ? new Date(donor.next_eligible_date) : null;
    return eligible && (!nextDate || nextDate <= new Date());
};

const shapeDonorResult = (d) => ({
    donor_id: d.id,
    name: d.name,
    phone: d.phone,
    blood_group: d.blood_group,
    city: d.city || null,
    state: d.state || null,
    profile_photo_url: d.profile_photo_url || null, // no photo storage yet — frontend renders an initials avatar
    availability: d.availability === true,
    eligible_for_donation: isDonorCurrentlyEligible(d),
    latitude: d.latitude,
    longitude: d.longitude,
    distance_km: d.distance_km,
    duration_min: d.duration_min,
});

/**
 * Ranks a donor pool by OSRM road distance to (destLat, destLng) and
 * returns the top `limit`. Donors OSRM couldn't route are dropped from
 * the ranked list (not distance-approximated) and counted separately.
 */
const rankNearestDonors = async (donors, destLat, destLng, limit) => {
    const withRoutes = await osrmSvc.getRoutesForDonorsBatch(donors, destLat, destLng);

    const routed = withRoutes.filter((d) => d.distance_km !== null);
    const unrouted = withRoutes.length - routed.length;

    routed.sort((a, b) => a.distance_km - b.distance_km);

    return {
        ranked: routed.slice(0, limit).map(shapeDonorResult),
        routing_unavailable: unrouted,
    };
};

/**
 * GET /api/request/:id/nearest
 * Nearest compatible, available, non-cooldown donors for a specific
 * blood request.
 */
const findNearestDonorsForRequest = async (hospital, request, limit = DEFAULT_LIMIT) => {
    const safeLimit = Math.min(Math.max(parseInt(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    if (!hospital.latitude || !hospital.longitude) {
        return { donors: [], total_compatible: 0, routing_unavailable: 0, message: 'Hospital location is not set — cannot compute road distances' };
    }

    const donorGroups = compatSvc.getCompatibleDonorGroups(request.blood_group);
    const donors = await donorRepo.findCompatibleDonors(donorGroups); // already excludes unavailable / cooldown donors

    if (!donors.length) {
        return { donors: [], total_compatible: 0, routing_unavailable: 0 };
    }

    const { ranked, routing_unavailable } = await rankNearestDonors(donors, hospital.latitude, hospital.longitude, safeLimit);

    return { donors: ranked, total_compatible: donors.length, routing_unavailable };
};

/**
 * GET /api/donor/nearest
 * Nearest compatible, available, non-cooldown donors for the logged-in
 * hospital in general — scoped to the blood groups of its currently
 * active (pending/accepted) requests, or all groups if it has none.
 */
const findNearestDonorsForHospital = async (hospital, limit = DEFAULT_LIMIT) => {
    const safeLimit = Math.min(Math.max(parseInt(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

    if (!hospital.latitude || !hospital.longitude) {
        return { donors: [], total_compatible: 0, routing_unavailable: 0, message: 'Hospital location is not set — cannot compute road distances' };
    }

    const { rows: activeRequestGroups } = await db.query(
        `SELECT DISTINCT blood_group FROM blood_requests WHERE hospital_id = $1 AND status IN ('pending','accepted')`,
        [hospital.id]
    );

    const donorGroupsSet = new Set();
    if (activeRequestGroups.length > 0) {
        activeRequestGroups.forEach((r) => {
            compatSvc.getCompatibleDonorGroups(r.blood_group).forEach((g) => donorGroupsSet.add(g));
        });
    } else {
        BLOOD_GROUPS.forEach((g) => donorGroupsSet.add(g));
    }

    const donors = await donorRepo.findCompatibleDonors(Array.from(donorGroupsSet));

    if (!donors.length) {
        return { donors: [], total_compatible: 0, routing_unavailable: 0 };
    }

    const { ranked, routing_unavailable } = await rankNearestDonors(donors, hospital.latitude, hospital.longitude, safeLimit);

    return { donors: ranked, total_compatible: donors.length, routing_unavailable };
};

/**
 * POST /api/request/:id/notify
 * scope: 'top5' | 'top10' | 'all'
 */
const notifyDonorsForRequest = async (hospital, request, scope) => {
    const donorGroups = compatSvc.getCompatibleDonorGroups(request.blood_group);
    const donors = await donorRepo.findCompatibleDonors(donorGroups);

    if (!donors.length) return { notified: 0, scope };

    let targets = donors;

    if (scope === 'top5' || scope === 'top10') {
        if (!hospital.latitude || !hospital.longitude) {
            throw new Error('Hospital location is not set — cannot compute nearest donors for this scope');
        }
        const limit = scope === 'top5' ? 5 : 10;
        const { ranked } = await rankNearestDonors(donors, hospital.latitude, hospital.longitude, limit);
        const rankedIds = new Set(ranked.map((d) => d.donor_id));
        targets = donors.filter((d) => rankedIds.has(d.id));
    }

    const notifPromises = targets.map((donor) =>
        notifSvc.notify(
            donor.user_id,
            `🩸 Blood Needed Urgently – ${request.blood_group}`,
            `${hospital.hospital_name} needs ${request.units_needed} unit(s) of ${request.blood_group} blood. Location: ${request.location}. Emergency: ${request.emergency_level}`
        ).catch((e) => console.error('Notification error:', e.message))
    );
    await Promise.all(notifPromises);

    return { notified: targets.length, scope };
};

module.exports = {
    findNearestDonorsForRequest,
    findNearestDonorsForHospital,
    notifyDonorsForRequest,
    isDonorCurrentlyEligible,
};
