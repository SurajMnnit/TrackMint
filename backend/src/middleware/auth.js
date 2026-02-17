/**
 * JWT authentication middleware.
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-dev-secret';

/**
 * Generate a signed JWT for a user.
 */
function signToken(userId) {
    return jwt.sign({ sub: userId }, JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
}

/**
 * Express middleware — verifies Bearer token on protected routes.
 * Attaches `req.userId` on success.
 */
async function requireAuth(req, res, next) {
    try {
        const header = req.headers.authorization;
        if (!header || !header.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        const token = header.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        // Verify user still exists
        const user = await User.findById(decoded.sub).select('_id');
        if (!user) {
            return res.status(401).json({ error: 'User no longer exists.' });
        }

        req.userId = decoded.sub;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Invalid or expired token.' });
        }
        next(err);
    }
}

module.exports = { signToken, requireAuth };
