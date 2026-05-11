// this file handles the user vs guest authentication for the app
// attaches a user object to the request if a valid token is provided, otherwise leaves it as guest

import jwt from 'jsonwebtoken';

const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            req.user = jwt.verify(header.substring(7), process.env.JWT_SECRET);
        } catch (err) {
            // Ignore JWT verification errors
            // treat user as guest if token is invalid or expired
        }
    }   
    next();
};

export default optionalAuth;