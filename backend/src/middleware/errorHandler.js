/**
 * Global error handler middleware.
 *
 * Catches all unhandled errors and returns structured JSON responses
 * with appropriate HTTP status codes.
 */

function errorHandler(err, _req, res, _next) {
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const details = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({
            error: 'Validation failed.',
            details,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        return res.status(409).json({
            error: `Duplicate value for ${field}.`,
        });
    }

    // Multer file-size error
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 5}MB.`,
        });
    }

    // Multer filter error
    if (err.message && err.message.includes('Only image files')) {
        return res.status(400).json({ error: err.message });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
        return res.status(400).json({ error: 'Invalid ID format.' });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // Default
    console.error('[Error]', err.stack || err.message);
    const status = err.statusCode || 500;
    res.status(status).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Internal server error.'
            : err.message || 'Internal server error.',
    });
}

module.exports = errorHandler;
