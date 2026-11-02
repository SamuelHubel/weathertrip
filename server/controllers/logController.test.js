import { describe, it, expect, vi, beforeEach } from 'vitest';

import Trip from '../models/Trip.js';
import getLoggedTrips from './logController.js';

vi.mock('../models/Trip.js', () => ({ default: { find: vi.fn() } }));

const mockRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
});

describe('getLoggedTrips', () => {
    let query;

    beforeEach(() => {
        vi.clearAllMocks();
        query = { select: vi.fn().mockReturnThis(), sort: vi.fn().mockReturnThis(), limit: vi.fn() };
        Trip.find.mockReturnValue(query);
    });

    it('returns an empty log for a guest without touching the database', async () => {
        const res = mockRes();

        await getLoggedTrips({}, res);

        expect(res.json).toHaveBeenCalledWith([]);
        expect(Trip.find).not.toHaveBeenCalled();
    });

    it("returns only the user's own trips, without route points, capped at 50", async () => {
        query.limit.mockResolvedValue([{ _id: 't1' }]);
        const res = mockRes();

        await getLoggedTrips({ user: { id: 'u1' } }, res);

        expect(Trip.find).toHaveBeenCalledWith({ userId: 'u1' });
        expect(query.select).toHaveBeenCalledWith('-route.geometry -route.weatherPoints');
        expect(query.limit).toHaveBeenCalledWith(50);
        expect(res.json).toHaveBeenCalledWith([{ _id: 't1' }]);
    });

    it('returns 500 when the database fails', async () => {
        query.limit.mockRejectedValue(new Error('db down'));
        const res = mockRes();

        await getLoggedTrips({ user: { id: 'u1' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });
});
