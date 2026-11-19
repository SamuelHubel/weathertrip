import axios from 'axios';

// live traffic incidents along a route, from TomTom Traffic Incident Details v5
// runs on the server so the API key stays secret; TomTom's limit is per key, not per IP
// returns [{ lat, lon, category, description, road, delay }], or null when incidents could not be loaded

const URL = 'https://api.tomtom.com/traffic/services/5/incidentDetails';
const FIELDS = '{incidents{geometry{type,coordinates},properties{id,iconCategory,events{description},from,to,roadNumbers,delay}}}';
// TomTom caps a bbox at 10,000 km²; stay under it
const MAX_AREA_KM2 = 9000;
// an incident this far from the route is on another road
const MAX_OFF_ROUTE_M = 150;
// 1 accident, 3 dangerous conditions, 5 ice, 7 lane closed, 8 road closed, 9 road works, 11 flooding
// jams and broken-down vehicles are noise; fog/rain/wind are already on the weather tiles
const KEPT = new Set([1, 3, 5, 7, 8, 9, 11]);
const KM_PER_DEG = 111.32;

const areaKm2 = ({ minLat, maxLat, minLon, maxLon }) =>
    (maxLat - minLat) * KM_PER_DEG * (maxLon - minLon) * KM_PER_DEG * Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);

// split the route into runs of points whose bounding box stays under the TomTom limit
// consecutive chunks share a point so no stretch of road falls between boxes
export function chunkRoute(geometry) {
    const chunks = [];
    let points = [];
    let box = null;
    for (const [lat, lon] of geometry) {
        const next = box
            ? { minLat: Math.min(box.minLat, lat), maxLat: Math.max(box.maxLat, lat), minLon: Math.min(box.minLon, lon), maxLon: Math.max(box.maxLon, lon) }
            : { minLat: lat, maxLat: lat, minLon: lon, maxLon: lon };
        if (points.length > 1 && areaKm2(next) > MAX_AREA_KM2) {
            chunks.push({ points, box });
            const last = points[points.length - 1];
            points = [last];
            box = { minLat: Math.min(last[0], lat), maxLat: Math.max(last[0], lat), minLon: Math.min(last[1], lon), maxLon: Math.max(last[1], lon) };
        } else {
            box = next;
        }
        points.push([lat, lon]);
    }
    if (points.length) chunks.push({ points, box });
    return chunks;
}

// metres from p to the segment a-b, on a flat projection (fine at these distances)
function distanceToSegment([lat, lon], [lat1, lon1], [lat2, lon2]) {
    const kx = Math.cos(lat * Math.PI / 180) * KM_PER_DEG * 1000;
    const ky = KM_PER_DEG * 1000;
    const ax = (lon1 - lon) * kx, ay = (lat1 - lat) * ky;
    const bx = (lon2 - lon) * kx, by = (lat2 - lat) * ky;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
    return Math.hypot(ax + t * dx, ay + t * dy);
}

const nearRoute = (point, points) =>
    points.length === 1
        ? distanceToSegment(point, points[0], points[0]) <= MAX_OFF_ROUTE_M
        : points.slice(1).some((b, i) => distanceToSegment(point, points[i], b) <= MAX_OFF_ROUTE_M);

// a tiny pad so incidents snapped to the road at the box edge are still inside
const PAD = 0.005;
const fetchChunk = async ({ box }) => {
    const { data } = await axios.get(URL, {
        params: {
            bbox: [box.minLon - PAD, box.minLat - PAD, box.maxLon + PAD, box.maxLat + PAD].map((n) => n.toFixed(5)).join(','),
            key: process.env.TOMTOM_KEY,
            fields: FIELDS,
            language: 'en-US',
            timeValidityFilter: 'present',
        },
        timeout: 10000,
    });
    return data.incidents ?? [];
};

const getIncidents = async (geometry) => {
    if (!process.env.TOMTOM_KEY || !geometry?.length) return null;
    try {
        const chunks = chunkRoute(geometry);
        const found = new Map();
        // shortcut: chunks 5 at a time; a cross-country route (~40 chunks) adds a few seconds. Move to a separate endpoint the browser calls after the trip loads if that is too slow.
        for (let i = 0; i < chunks.length; i += 5) {
            const batch = chunks.slice(i, i + 5);
            const results = await Promise.all(batch.map(fetchChunk));
            results.forEach((incidents, j) => {
                for (const { geometry: g, properties: p = {} } of incidents) {
                    if (!KEPT.has(p.iconCategory)) continue;
                    const [lon, lat] = g?.type === 'Point' ? g.coordinates : g?.coordinates?.[0] ?? [];
                    // chunks overlap at their joins, so the same incident can come back twice
                    const id = p.id ?? `${lat},${lon}`;
                    if (lat == null || found.has(id) || !nearRoute([lat, lon], batch[j].points)) continue;
                    found.set(id, {
                        lat,
                        lon,
                        category: p.iconCategory,
                        description: p.events?.[0]?.description ?? '',
                        road: p.roadNumbers?.join(', ') || p.from || '',
                        delay: p.delay ?? 0,
                    });
                }
            });
        }
        return [...found.values()];
    } catch (error) {
        // host only: the query holds the route's area
        console.error('Incidents error:', error.message, error.response?.status ?? '');
        return null;
    }
};

export default getIncidents;
