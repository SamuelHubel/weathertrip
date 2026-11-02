import { describe, it, expect, vi, beforeEach } from 'vitest';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
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

    it('logs in with the right password and returns a valid token', async () => {
        User.findOne.mockResolvedValue({ _id: 'u1', email: 'a@b.co', password: 'hash' });
        bcrypt.compare.mockResolvedValue(true);
        const res = mockRes();

        await login({ body: { email: ' A@B.co ', password: 'password' } }, res);

        expect(User.findOne).toHaveBeenCalledWith({ email: 'a@b.co' });
        const { token, email } = res.json.mock.calls[0][0];
        expect(email).toBe('a@b.co');
        expect(jwt.verify(token, process.env.JWT_SECRET).id).toBe('u1');
    });

    it('gives the same error for a wrong password and an unknown email', async () => {
        User.findOne.mockResolvedValueOnce({ _id: 'u1', email: 'a@b.co', password: 'hash' });
        bcrypt.compare.mockResolvedValue(false);
        const wrongPassword = mockRes();
        await login({ body: { email: 'a@b.co', password: 'nope' } }, wrongPassword);

        User.findOne.mockResolvedValueOnce(null);
        const unknownEmail = mockRes();
        await login({ body: { email: 'x@y.co', password: 'nope' } }, unknownEmail);

        for (const res of [wrongPassword, unknownEmail]) {
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
        }
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
