import { describe, it, expect, vi, beforeEach } from 'vitest';
import getTrip from '../controllers/tripController.js';

// Mock the services so we never make real network calls
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

// ── Fixtures ──────────────────────────────────────────────────────

const mockStart = { lat: 39.7392364, lon: -104.990251 }; // Denver, CO
const mockEnd   = { lat: 40.7608,    lon: -111.8910    }; // Salt Lake City, UT

const mockRoute = {
    distance: 685000,
    duration: 22200,
    geometry: {
        coordinates: [
            [-104.990251, 39.7392364],
            [-106.5,      40.1      ],
            [-111.8910,   40.7608   ],
        ],
    },
};

// Expected geometry after lon/lat swap performed by the controller
const expectedGeometry = [
    [39.7392364, -104.990251],
    [40.1,       -106.5     ],
    [40.7608,    -111.8910  ],
];

// Helper to build mock Express req/res objects
function makeMocks(body = {}) {
    const req = { body };
    const res = {
        json:   vi.fn(),
        status: vi.fn().mockReturnThis(),
    };
    return { req, res };
}

// ── Tests ─────────────────────────────────────────────────────────

beforeEach(() => {
    vi.clearAllMocks();
});

describe('getTrip — happy path', () => {
    it('returns trip data with swapped geometry coordinates', async () => {
        geocodingService.geocodeLocation
            .mockResolvedValueOnce(mockStart)
            .mockResolvedValueOnce(mockEnd);
        getRoute.mockResolvedValue(mockRoute);

        const { req, res } = makeMocks({ start: 'Denver, CO', end: 'Salt Lake City, UT' });
        await getTrip(req, res);

        expect(res.json).toHaveBeenCalledWith({
            start: mockStart,
            end:   mockEnd,
            route: {
                distance: mockRoute.distance,
                duration: mockRoute.duration,
                geometry: expectedGeometry,
            },
        });
    });

    it('calls geocodeLocation for both start and end', async () => {
        geocodingService.geocodeLocation
            .mockResolvedValueOnce(mockStart)
            .mockResolvedValueOnce(mockEnd);
        getRoute.mockResolvedValue(mockRoute);

        const { req, res } = makeMocks({ start: 'Denver, CO', end: 'Salt Lake City, UT' });
        await getTrip(req, res);

        expect(geocodingService.geocodeLocation).toHaveBeenCalledTimes(2);
        expect(geocodingService.geocodeLocation).toHaveBeenCalledWith('Denver, CO');
        expect(geocodingService.geocodeLocation).toHaveBeenCalledWith('Salt Lake City, UT');
    });

    it('calls getRoute with the geocoded start and end', async () => {
        geocodingService.geocodeLocation
            .mockResolvedValueOnce(mockStart)
            .mockResolvedValueOnce(mockEnd);
        getRoute.mockResolvedValue(mockRoute);

        const { req, res } = makeMocks({ start: 'Denver, CO', end: 'Salt Lake City, UT' });
        await getTrip(req, res);

        expect(getRoute).toHaveBeenCalledWith(mockStart, mockEnd);
    });
});

describe('getTrip — missing request body fields', () => {
    it('returns 400 when start is missing', async () => {
        const { req, res } = makeMocks({ end: 'Salt Lake City, UT' });
        await getTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing start or end location' });
    });

    it('returns 400 when end is missing', async () => {
        const { req, res } = makeMocks({ start: 'Denver, CO' });
        await getTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing start or end location' });
    });

    it('returns 400 when both start and end are missing', async () => {
        const { req, res } = makeMocks({});
        await getTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Missing start or end location' });
    });
});

describe('getTrip — geocoding failures', () => {
    it('returns 400 when start location cannot be geocoded', async () => {
        geocodingService.geocodeLocation
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(mockEnd);

        const { req, res } = makeMocks({ start: 'Nowhere', end: 'Salt Lake City, UT' });
        await getTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid start or end location' });
    });

    it('returns 400 when end location cannot be geocoded', async () => {
        geocodingService.geocodeLocation
            .mockResolvedValueOnce(mockStart)
            .mockResolvedValueOnce(null);

        const { req, res } = makeMocks({ start: 'Denver, CO', end: 'Nowhere' });
        await getTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid start or end location' });
    });

    it('returns 400 when both locations cannot be geocoded', async () => {
        geocodingService.geocodeLocation
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);

        const { req, res } = makeMocks({ start: 'Nowhere', end: 'Alsowhere' });
        await getTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Invalid start or end location' });
    });
});

describe('getTrip — routing failures', () => {
    it('returns 400 when no route is found', async () => {
        geocodingService.geocodeLocation
            .mockResolvedValueOnce(mockStart)
            .mockResolvedValueOnce(mockEnd);
        getRoute.mockResolvedValue(null);

        const { req, res } = makeMocks({ start: 'Denver, CO', end: 'Salt Lake City, UT' });
        await getTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'No route found' });
    });
});

describe('getTrip — unexpected errors', () => {
    it('returns 500 when geocoding throws an exception', async () => {
        geocodingService.geocodeLocation.mockRejectedValue(new Error('Geocoding service down'));

        const { req, res } = makeMocks({ start: 'Denver, CO', end: 'Salt Lake City, UT' });
        await getTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to process trip' });
    });

    it('returns 500 when routing throws an exception', async () => {
        geocodingService.geocodeLocation
            .mockResolvedValueOnce(mockStart)
            .mockResolvedValueOnce(mockEnd);
        getRoute.mockRejectedValue(new Error('Routing service down'));

        const { req, res } = makeMocks({ start: 'Denver, CO', end: 'Salt Lake City, UT' });
        await getTrip(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ error: 'Failed to process trip' });
    });
});