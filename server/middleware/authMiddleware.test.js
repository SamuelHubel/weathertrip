import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import optionalAuth from './authMiddleware.js';

const mockRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
});

describe('optionalAuth', () => {
    beforeEach(() => {
        process.env.JWT_SECRET = 'test-secret';
    });

    it('treats a request with no token as a guest', () => {
        const req = { headers: {} };
        const next = vi.fn();

        optionalAuth(req, mockRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.user).toBeUndefined();
    });

    it('attaches the user for a valid token', () => {
        const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET);
        const req = { headers: { authorization: `Bearer ${token}` } };
        const next = vi.fn();

        optionalAuth(req, mockRes(), next);

        expect(next).toHaveBeenCalled();
        expect(req.user.id).toBe('u1');
    });

    it('returns 401 for an expired token', () => {
        const token = jwt.sign({ id: 'u1' }, process.env.JWT_SECRET, { expiresIn: -1 });
        const res = mockRes();
        const next = vi.fn();

        optionalAuth({ headers: { authorization: `Bearer ${token}` } }, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
    });
});
