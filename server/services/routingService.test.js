import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios');
vi.mock('../services/routeSamplingService.js', () => ({
    default: vi.fn(),
}));

import axios from 'axios';
import sampleRoute from '../services/routeSamplingService.js';
import getRoute from './routingService.js';

// Minimal OSRM-shaped response
const makeOsrmResponse = (coordinates) => ({
    data: {
        routes: [
            {
                distance: 4_500_000,
                duration: 144_000,
                geometry: { coordinates },
            },
        ],
    },
});

const MOCK_COORDS_LON_LAT = [
    [-74.006,   40.7128],   // New York  (lon, lat — OSRM order)
    [-118.2437, 34.0522],   // LA
];

// Expected after the lon/lat → lat/lon swap
const MOCK_COORDS_LAT_LON = [
    [40.7128,  -74.006  ],
    [34.0522, -118.2437 ],
];

const MOCK_WEATHER_POINTS = [
    { lat: 40.7128, lon: -74.006 },
    { lat: 34.0522, lon: -118.2437 },
];

const START = { lat: 40.7128, lon: -74.006  };
const END   = { lat: 34.0522, lon: -118.2437 };

describe('getRoute', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default env
        process.env.OSRM_URL = 'http://router.osrm.example';
    });

    // ── Happy path ────────────────────────────────────────────────────────────

    describe('successful route fetch', () => {
        beforeEach(() => {
            axios.get.mockResolvedValueOnce(makeOsrmResponse(MOCK_COORDS_LON_LAT));
            sampleRoute.mockReturnValueOnce(MOCK_WEATHER_POINTS);
        });

        it('calls the OSRM API with the correct driving URL', async () => {
            await getRoute(START, END);

            const calledUrl = axios.get.mock.calls[0][0];
            expect(calledUrl).toBe(
                `http://router.osrm.example/route/v1/driving/${START.lon},${START.lat};${END.lon},${END.lat}`
            );
        });

        it('requests full geometry in geojson format', async () => {
            await getRoute(START, END);

            const params = axios.get.mock.calls[0][1].params;
            expect(params).toEqual({ overview: 'full', geometries: 'geojson' });
        });

        it('swaps lon/lat to lat/lon in the returned geometry', async () => {
            const result = await getRoute(START, END);

            expect(result.geometry).toEqual(MOCK_COORDS_LAT_LON);
        });

        it('returns distance and duration from the OSRM response', async () => {
            const result = await getRoute(START, END);

            expect(result.distance).toBe(4_500_000);
            expect(result.duration).toBe(144_000);
        });

        it('passes the converted coordinates to sampleRoute with 80 km interval', async () => {
            await getRoute(START, END);

            expect(sampleRoute).toHaveBeenCalledWith(MOCK_COORDS_LAT_LON, 80_000);
        });

        it('includes the weather points returned by sampleRoute', async () => {
            const result = await getRoute(START, END);

            expect(result.weatherPoints).toEqual(MOCK_WEATHER_POINTS);
        });

        it('returns a complete route object with all expected keys', async () => {
            const result = await getRoute(START, END);

            expect(result).toMatchObject({
                distance:      expect.any(Number),
                duration:      expect.any(Number),
                geometry:      expect.any(Array),
                weatherPoints: expect.any(Array),
            });
        });
    });

    // ── Coordinate transformation ─────────────────────────────────────────────

    describe('coordinate transformation', () => {
        it('correctly swaps a single coordinate pair', async () => {
            axios.get.mockResolvedValueOnce(makeOsrmResponse([[-73.935242, 40.730610]]));
            sampleRoute.mockReturnValueOnce([]);

            const result = await getRoute(START, END);

            expect(result.geometry).toEqual([[40.730610, -73.935242]]);
        });

        it('preserves the order of multiple coordinate pairs after swapping', async () => {
            const coords = [
                [-74.006,   40.7128 ],
                [-80.0,     35.0    ],
                [-118.2437, 34.0522 ],
            ];
            axios.get.mockResolvedValueOnce(makeOsrmResponse(coords));
            sampleRoute.mockReturnValueOnce([]);

            const result = await getRoute(START, END);

            expect(result.geometry).toEqual([
                [40.7128,  -74.006  ],
                [35.0,     -80.0   ],
                [34.0522, -118.2437],
            ]);
        });
    });

    // ── Error handling ────────────────────────────────────────────────────────

    describe('error handling', () => {
        it('returns null when axios.get throws a network error', async () => {
            axios.get.mockRejectedValueOnce(new Error('ECONNREFUSED'));

            const result = await getRoute(START, END);

            expect(result).toBeNull();
        });

        it('returns null when the OSRM response has no routes', async () => {
            axios.get.mockResolvedValueOnce({ data: { routes: [] } });

            const result = await getRoute(START, END);

            // Accessing routes[0] will be undefined → destructuring throws
            expect(result).toBeNull();
        });

        it('returns null when axios.get rejects with a timeout', async () => {
            const timeoutError = new Error('timeout of 5000ms exceeded');
            timeoutError.code = 'ECONNABORTED';
            axios.get.mockRejectedValueOnce(timeoutError);

            const result = await getRoute(START, END);

            expect(result).toBeNull();
        });

        it('does not throw — always resolves', async () => {
            axios.get.mockRejectedValueOnce(new Error('Unexpected failure'));

            await expect(getRoute(START, END)).resolves.not.toThrow();
        });
    });
});