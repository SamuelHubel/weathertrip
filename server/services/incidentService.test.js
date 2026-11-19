import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('axios');

import axios from 'axios';
import getIncidents, { chunkRoute } from './incidentService.js';

// a straight north-south road, 0.01° (~1.1 km) between points
const ROUTE = Array.from({ length: 11 }, (_, i) => [40 + i * 0.01, -105]);

const incident = (id, iconCategory, [lat, lon], extra = {}) => ({
    geometry: { type: 'LineString', coordinates: [[lon, lat], [lon, lat + 0.001]] },
    properties: { id, iconCategory, events: [{ description: `incident ${id}` }], roadNumbers: ['I-25'], delay: 120, ...extra },
});

const area = ({ minLat, maxLat, minLon, maxLon }) =>
    (maxLat - minLat) * 111.32 * (maxLon - minLon) * 111.32 * Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);

describe('chunkRoute', () => {
    it('keeps a short route in one box', () => {
        expect(chunkRoute(ROUTE)).toHaveLength(1);
    });

    it('splits a long diagonal route into boxes under the TomTom limit, sharing join points', () => {
        // ~1,100 km diagonal, 1 km steps
        const long = Array.from({ length: 1001 }, (_, i) => [35 + i * 0.007, -110 + i * 0.007]);
        const chunks = chunkRoute(long);
        expect(chunks.length).toBeGreaterThan(5);
        for (const { box } of chunks) expect(area(box)).toBeLessThanOrEqual(9000);
        for (let i = 1; i < chunks.length; i++) expect(chunks[i].points[0]).toEqual(chunks[i - 1].points.at(-1));
        expect(chunks.reduce((n, c) => n + c.points.length, 0)).toBe(long.length + chunks.length - 1);
    });
});

describe('getIncidents', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.TOMTOM_KEY = 'test-key';
    });
    afterEach(() => delete process.env.TOMTOM_KEY);

    it('returns null without a key and makes no request', async () => {
        delete process.env.TOMTOM_KEY;
        expect(await getIncidents(ROUTE)).toBeNull();
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('keeps on-route incidents of kept categories, once each', async () => {
        axios.get.mockResolvedValue({
            data: {
                incidents: [
                    // between route vertices, on the road
                    incident('a', 8, [40.055, -105]),
                    // same incident again
                    incident('a', 8, [40.055, -105]),
                    // a jam: dropped
                    incident('b', 6, [40.03, -105]),
                    // ~850 m east, another road: dropped
                    incident('c', 1, [40.03, -104.99]),
                ],
            },
        });
        expect(await getIncidents(ROUTE)).toEqual([
            { lat: 40.055, lon: -105, category: 8, description: 'incident a', road: 'I-25', delay: 120 },
        ]);
        const { params } = axios.get.mock.calls[0][1];
        expect(params.key).toBe('test-key');
        expect(params.bbox.split(',').map(Number)).toEqual([-105.005, 39.995, -104.995, 40.105]);
    });

    it('returns null when TomTom fails', async () => {
        axios.get.mockRejectedValue(new Error('timeout'));
        expect(await getIncidents(ROUTE)).toBeNull();
    });
});
