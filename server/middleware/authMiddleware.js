// this file handles the user vs guest authentication for the app
// attaches a user object if a valid token is provided, treats no token as a guest, and rejects a bad token

import jwt from 'jsonwebtoken';

const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(header.substring(7), process.env.JWT_SECRET);
        } catch (err) {
            // a sent token that fails means an expired session, not a guest
            return res.status(401).json({ error: 'Session expired' });
        }
    }   
    next();
};

export default optionalAuth;