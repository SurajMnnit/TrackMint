/**
 * Idempotency middleware for MongoDB.
 *
 * Flow:
 *   1. Client sends `Idempotency-Key` header (UUID v4) with every POST.
 *   2. Middleware checks if key exists in the idempotency_keys collection.
 *   3. Found → return cached response (same status + body). No new expense.
 *   4. Not found → let route handler proceed, which uses a MongoDB transaction
 *      to atomically create the expense AND store the idempotency record.
 *   5. Expired keys are auto-deleted by MongoDB's TTL index on `expires_at`.
 *
 * MongoDB transactions ensure that if the expense insert succeeds but the
 * idempotency record fails (or vice versa), both are rolled back.
 */

const IdempotencyKey = require('../models/IdempotencyKey');

const HEADER = 'idempotency-key';

/**
 * Express middleware — checks for existing idempotency key.
 */
async function idempotencyGuard(req, res, next) {
    if (req.method !== 'POST') return next();

    const key = req.headers[HEADER];
    if (!key || typeof key !== 'string' || key.trim().length === 0) {
        return res.status(400).json({
            error: 'Missing or empty Idempotency-Key header.',
        });
    }

    try {
        const existing = await IdempotencyKey.findOne({ key }).lean();

        if (existing) {
            // Return cached response — idempotent replay
            return res.status(existing.status_code).json(existing.response);
        }

        // Attach key so the route handler can store it after creation
        res.locals.idempotencyKey = key;
        next();
    } catch (err) {
        next(err);
    }
}

/**
 * Store the idempotency record after a successful response.
 * Called by the route handler inside a MongoDB transaction session.
 */
async function storeIdempotencyRecord(key, expenseId, statusCode, responseBody, session = null) {
    const ttl = parseInt(process.env.IDEMPOTENCY_TTL_SECONDS, 10) || 86400;
    const expiresAt = new Date(Date.now() + ttl * 1000);

    const opts = session ? { session } : {};

    await IdempotencyKey.create(
        [
            {
                key,
                expense_id: expenseId,
                status_code: statusCode,
                response: responseBody,
                expires_at: expiresAt,
            },
        ],
        opts
    );
}

module.exports = { idempotencyGuard, storeIdempotencyRecord };
