import { describe, it, expect, vi, beforeEach } from 'vitest';

import Trip from '../models/Trip.js';
import getLoggedTrips, { renameTrip, deleteTrip } from './logController.js';

vi.mock('../models/Trip.js', () => ({ default: { find: vi.fn(), findOneAndUpdate: vi.fn(), findOneAndDelete: vi.fn() } }));

const mockRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
});

describe('getLoggedTrips', () => {
    let query;

    beforeEach(() => {
        vi.clearAllMocks();
        query = { sort: vi.fn().mockReturnThis(), limit: vi.fn() };
        Trip.find.mockReturnValue(query);
    });

    it('returns an empty log for a guest without touching the database', async () => {
        const res = mockRes();

        await getLoggedTrips({}, res);

        expect(res.json).toHaveBeenCalledWith([]);
        expect(Trip.find).not.toHaveBeenCalled();
    });

    it("returns only the user's own trips, newest first, capped at 50", async () => {
        query.limit.mockResolvedValue([{ _id: 't1' }]);
        const res = mockRes();

        await getLoggedTrips({ user: { id: 'u1' } }, res);

        expect(Trip.find).toHaveBeenCalledWith({ userId: 'u1' });
        expect(query.sort).toHaveBeenCalledWith({ createdAt: -1 });
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

describe('renameTrip', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects a guest', async () => {
        const res = mockRes();
        await renameTrip({ params: { id: 't1' }, body: { name: 'x' } }, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(Trip.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it("renames only the user's own trip, trimmed", async () => {
        Trip.findOneAndUpdate.mockResolvedValue({ _id: 't1', name: 'Ski trip' });
        const res = mockRes();
        await renameTrip({ user: { id: 'u1' }, params: { id: 't1' }, body: { name: '  Ski trip ' } }, res);
        expect(Trip.findOneAndUpdate).toHaveBeenCalledWith(
            { _id: 't1', userId: 'u1' }, { name: 'Ski trip' }, expect.anything());
        expect(res.json).toHaveBeenCalledWith({ _id: 't1', name: 'Ski trip' });
    });

    it("returns 404 for a trip that is missing or someone else's", async () => {
        Trip.findOneAndUpdate.mockResolvedValue(null);
        const res = mockRes();
        await renameTrip({ user: { id: 'u1' }, params: { id: 't2' }, body: { name: 'x' } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    it('rejects a non-text name', async () => {
        const res = mockRes();
        await renameTrip({ user: { id: 'u1' }, params: { id: 't1' }, body: {} }, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

describe('deleteTrip', () => {
    beforeEach(() => vi.clearAllMocks());

    it('rejects a guest', async () => {
        const res = mockRes();
        await deleteTrip({ params: { id: 't1' } }, res);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(Trip.findOneAndDelete).not.toHaveBeenCalled();
    });

    it("deletes only the user's own trip", async () => {
        Trip.findOneAndDelete.mockResolvedValue({ _id: 't1' });
        const res = mockRes();
        await deleteTrip({ user: { id: 'u1' }, params: { id: 't1' } }, res);
        expect(Trip.findOneAndDelete).toHaveBeenCalledWith({ _id: 't1', userId: 'u1' });
        expect(res.status).toHaveBeenCalledWith(204);
    });

    it("returns 404 for a trip that is missing or someone else's", async () => {
        Trip.findOneAndDelete.mockResolvedValue(null);
        const res = mockRes();
        await deleteTrip({ user: { id: 'u1' }, params: { id: 't2' } }, res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});
