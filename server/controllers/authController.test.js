import { describe, it, expect, vi, beforeEach } from 'vitest';

import User from '../models/User.js';
import { register, login } from './authController.js';

vi.mock('../models/User.js', () => ({
    default: { findOne: vi.fn(), create: vi.fn() },
}));
vi.mock('bcryptjs', () => ({
    default: { hash: vi.fn().mockResolvedValue('hash'), compare: vi.fn() },
}));

const mockRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
});

describe('authController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.JWT_SECRET = 'test-secret';
    });

    it('returns 409 when two sign-ups race on the same email', async () => {
        User.findOne.mockResolvedValue(null);
        User.create.mockRejectedValue(Object.assign(new Error('dup'), { code: 11000 }));
        const res = mockRes();

        await register({ body: { email: 'a@b.co', password: 'password' } }, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ error: 'Email already in use' });
    });

    it('returns 500 from register when the database fails', async () => {
        User.findOne.mockRejectedValue(new Error('db down'));
        const res = mockRes();

        await register({ body: { email: 'a@b.co', password: 'password' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('returns 500 from login when the database fails', async () => {
        User.findOne.mockRejectedValue(new Error('db down'));
        const res = mockRes();

        await login({ body: { email: 'a@b.co', password: 'password' } }, res);

        expect(res.status).toHaveBeenCalledWith(500);
    });

    it('rejects a request with no JSON body', async () => {
        const res = mockRes();

        await register({}, res);
        expect(res.status).toHaveBeenCalledWith(400);

        await login({}, res);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
