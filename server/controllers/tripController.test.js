import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the controller
vi.mock('../services/geocodingService.js', () => ({
    default: {
        geocodeLocation: vi.fn(),
    },
}));

vi.mock('../services/routingService.js', () => ({
    default: vi.fn(),
}));

import geocodingService from '../services/geocodingService.js';
import getRoute from '../services/routingService.js';
import getTrip from './tripController.js';

// Helper to create a mock Express req/res pair
const mockReqRes = (body = {}) => {
    const req = { body };
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    };
    return { req, res };
};

const MOCK_START_LOCATION = { lat: 40.7128, lon: -74.006 };
const MOCK_END_LOCATION   = { lat: 34.0522, lon: -118.2437 };
const MOCK_ROUTE = {
    distance: 4_500_000,
    duration: 144_000,
    geometry: [[40.7128, -74.006], [34.0522, -118.2437]],
    weatherPoints: [
        { lat: 40.7128, lon: -74.006 },
        { lat: 34.0522, lon: -118.2437 },
    ],
};

describe('getTrip', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ── Validation ────────────────────────────────────────────────────────────

    describe('request validation', () => {
        it('returns 400 when start is missing', async () => {
            const { req, res } = mockReqRes({ end: 'Los Angeles' });
            await getTrip(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Missing start or end location' });
        });

        it('returns 400 when end is missing', async () => {
            const { req, res } = mockReqRes({ start: 'New York' });
            await getTrip(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Missing start or end location' });
        });

        it('returns 400 when both start and end are missing', async () => {
            const { req, res } = mockReqRes({});
            await getTrip(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Missing start or end location' });
        });

        it('does not call geocoding when validation fails', async () => {
            const { req, res } = mockReqRes({ start: 'New York' });
            await getTrip(req, res);

            expect(geocodingService.geocodeLocation).not.toHaveBeenCalled();
        });
    });

    // ── Geocoding failures ────────────────────────────────────────────────────

    describe('geocoding failures', () => {
        it('returns 400 when start cannot be geocoded', async () => {
            geocodingService.geocodeLocation
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(MOCK_END_LOCATION);

            const { req, res } = mockReqRes({ start: 'Nowhere', end: 'Los Angeles' });
            await getTrip(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid start or end location' });
        });

        it('returns 400 when end cannot be geocoded', async () => {
            geocodingService.geocodeLocation
                .mockResolvedValueOnce(MOCK_START_LOCATION)
                .mockResolvedValueOnce(null);

            const { req, res } = mockReqRes({ start: 'New York', end: 'Nowhere' });
            await getTrip(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid start or end location' });
        });

        it('returns 400 when both locations fail to geocode', async () => {
            geocodingService.geocodeLocation.mockResolvedValue(null);

            const { req, res } = mockReqRes({ start: 'Nowhere', end: 'Also Nowhere' });
            await getTrip(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid start or end location' });
        });

        it('does not call getRoute when geocoding fails', async () => {
            geocodingService.geocodeLocation.mockResolvedValue(null);

            const { req, res } = mockReqRes({ start: 'Nowhere', end: 'Los Angeles' });
            await getTrip(req, res);

            expect(getRoute).not.toHaveBeenCalled();
        });
    });

    // ── Routing failures ──────────────────────────────────────────────────────

    describe('routing failures', () => {
        it('returns 400 when no route is found', async () => {
            geocodingService.geocodeLocation
                .mockResolvedValueOnce(MOCK_START_LOCATION)
                .mockResolvedValueOnce(MOCK_END_LOCATION);
            getRoute.mockResolvedValueOnce(null);

            const { req, res } = mockReqRes({ start: 'New York', end: 'Los Angeles' });
            await getTrip(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'No route found' });
        });
    });

    // ── Happy path ────────────────────────────────────────────────────────────

    describe('successful trip', () => {
        beforeEach(() => {
            geocodingService.geocodeLocation
                .mockResolvedValueOnce(MOCK_START_LOCATION)
                .mockResolvedValueOnce(MOCK_END_LOCATION);
            getRoute.mockResolvedValueOnce(MOCK_ROUTE);
        });

        it('responds with correctly shaped trip data', async () => {
            const { req, res } = mockReqRes({ start: 'New York', end: 'Los Angeles' });
            await getTrip(req, res);

            expect(res.json).toHaveBeenCalledWith({
                start: { lat: MOCK_START_LOCATION.lat, lon: MOCK_START_LOCATION.lon },
                end:   { lat: MOCK_END_LOCATION.lat,   lon: MOCK_END_LOCATION.lon   },
                route: {
                    distance:      MOCK_ROUTE.distance,
                    duration:      MOCK_ROUTE.duration,
                    geometry:      MOCK_ROUTE.geometry,
                    weatherPoints: MOCK_ROUTE.weatherPoints,
                },
            });
        });

        it('does not call res.status on success', async () => {
            const { req, res } = mockReqRes({ start: 'New York', end: 'Los Angeles' });
            await getTrip(req, res);

            expect(res.status).not.toHaveBeenCalled();
        });

        it('calls geocodeLocation with the provided start and end strings', async () => {
            const { req, res } = mockReqRes({ start: 'New York', end: 'Los Angeles' });
            await getTrip(req, res);

            expect(geocodingService.geocodeLocation).toHaveBeenCalledWith('New York');
            expect(geocodingService.geocodeLocation).toHaveBeenCalledWith('Los Angeles');
        });

        it('calls getRoute with the resolved coordinate objects', async () => {
            const { req, res } = mockReqRes({ start: 'New York', end: 'Los Angeles' });
            await getTrip(req, res);

            expect(getRoute).toHaveBeenCalledWith(MOCK_START_LOCATION, MOCK_END_LOCATION);
        });
    });

    // ── Unexpected errors ─────────────────────────────────────────────────────

    describe('unexpected errors', () => {
        it('returns 500 when geocodingService throws', async () => {
            geocodingService.geocodeLocation.mockRejectedValueOnce(new Error('Service unavailable'));

            const { req, res } = mockReqRes({ start: 'New York', end: 'Los Angeles' });
            await getTrip(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to process trip' });
        });

        it('returns 500 when getRoute throws', async () => {
            geocodingService.geocodeLocation
                .mockResolvedValueOnce(MOCK_START_LOCATION)
                .mockResolvedValueOnce(MOCK_END_LOCATION);
            getRoute.mockRejectedValueOnce(new Error('OSRM timeout'));

            const { req, res } = mockReqRes({ start: 'New York', end: 'Los Angeles' });
            await getTrip(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ error: 'Failed to process trip' });
        });
    });
});