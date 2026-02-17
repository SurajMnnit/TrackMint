/**
 * Expense routes — all protected by JWT auth.
 *
 * POST   /expenses        — Create (idempotent, optional receipt upload)
 * GET    /expenses        — List with filter, sort, pagination
 * PUT    /expenses/:id    — Update (ownership validated)
 * DELETE /expenses/:id    — Delete (ownership validated)
 */

const express = require('express');
const mongoose = require('mongoose');
const Expense = require('../models/Expense');
const { ALLOWED_CATEGORIES } = require('../models/Expense');
const { requireAuth } = require('../middleware/auth');
const { idempotencyGuard, storeIdempotencyRecord } = require('../middleware/idempotency');
const { toSubunit, fromSubunit, getCurrency } = require('../config/currency');
const upload = require('../middleware/upload');

const router = express.Router();

// All expense routes require authentication
router.use(requireAuth);

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatExpense(doc) {
    const currency = getCurrency();
    return {
        id: doc._id,
        amount: fromSubunit(doc.amount_paise),
        amount_paise: doc.amount_paise,
        category: doc.category,
        description: doc.description,
        date: doc.date,
        receipt_path: doc.receipt_path || null,
        currency_symbol: currency.symbol,
        currency_code: currency.code,
        created_at: doc.created_at,
    };
}

function validateExpenseBody(body) {
    const errors = [];

    if (body.amount === undefined || body.amount === null || body.amount === '') {
        errors.push('Amount is required.');
    } else {
        const n = Number(body.amount);
        if (isNaN(n) || n <= 0) {
            errors.push('Amount must be a positive number.');
        }
    }

    if (!body.category || typeof body.category !== 'string' || body.category.trim() === '') {
        errors.push('Category is required.');
    } else if (!ALLOWED_CATEGORIES.includes(body.category.toLowerCase().trim())) {
        errors.push(`Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`);
    }

    if (!body.date || typeof body.date !== 'string' || body.date.trim() === '') {
        errors.push('Date is required.');
    } else {
        const d = new Date(body.date);
        if (isNaN(d.getTime())) {
            errors.push('Date must be a valid date string.');
        }
    }

    if (body.description !== undefined && typeof body.description !== 'string') {
        errors.push('Description must be a string.');
    }

    return errors;
}

// ── POST /expenses ────────────────────────────────────────────────────────────

/**
 * Attempt transactional create; fall back to non-transactional for standalone
 * MongoDB instances (no replica set). Transactions are preferred because they
 * ensure atomicity between expense creation and idempotency record storage.
 */
async function createExpenseTransactional(req, res) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { amountPaise, category, description, date, receiptPath } = res.locals.parsedExpense;

        const [expense] = await Expense.create(
            [{ user_id: req.userId, amount_paise: amountPaise, category, description, date, receipt_path: receiptPath }],
            { session }
        );

        const responseBody = { data: formatExpense(expense) };

        if (res.locals.idempotencyKey) {
            await storeIdempotencyRecord(res.locals.idempotencyKey, expense._id, 201, responseBody, session);
        }

        await session.commitTransaction();
        session.endSession();
        return { expense, responseBody };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

async function createExpenseNonTransactional(req, res) {
    const { amountPaise, category, description, date, receiptPath } = res.locals.parsedExpense;

    const expense = await Expense.create({
        user_id: req.userId,
        amount_paise: amountPaise,
        category,
        description,
        date,
        receipt_path: receiptPath,
    });

    const responseBody = { data: formatExpense(expense) };

    if (res.locals.idempotencyKey) {
        await storeIdempotencyRecord(res.locals.idempotencyKey, expense._id, 201, responseBody);
    }

    return { expense, responseBody };
}

router.post(
    '/',
    upload.single('receipt'),
    idempotencyGuard,
    async (req, res, next) => {
        try {
            const errors = validateExpenseBody(req.body);
            if (errors.length > 0) {
                return res.status(400).json({ error: 'Validation failed.', details: errors });
            }

            // Parse and stash validated data
            res.locals.parsedExpense = {
                amountPaise: toSubunit(req.body.amount),
                category: req.body.category.toLowerCase().trim(),
                description: (req.body.description || '').trim(),
                date: new Date(req.body.date.trim()),
                receiptPath: req.file ? req.file.filename : null,
            };

            let result;
            try {
                result = await createExpenseTransactional(req, res);
            } catch (txErr) {
                // Graceful fallback: if transactions aren't supported (standalone MongoDB)
                if (
                    txErr.message?.includes('Transaction') ||
                    txErr.message?.includes('transaction') ||
                    txErr.codeName === 'IllegalOperation'
                ) {
                    result = await createExpenseNonTransactional(req, res);
                } else {
                    throw txErr;
                }
            }

            return res.status(201).json(result.responseBody);
        } catch (err) {
            next(err);
        }
    }
);

// ── GET /expenses ─────────────────────────────────────────────────────────────

router.get('/', async (req, res, next) => {
    try {
        const filter = { user_id: new mongoose.Types.ObjectId(req.userId) };

        // Category filter
        if (req.query.category && req.query.category.trim() !== '') {
            filter.category = req.query.category.toLowerCase().trim();
        }

        // Sort
        let sortObj = { date: -1, created_at: -1 }; // default: newest first
        if (req.query.sort === 'date_asc') {
            sortObj = { date: 1, created_at: 1 };
        }

        // Pagination
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
        const skip = (page - 1) * limit;

        const [docs, totalCount] = await Promise.all([
            Expense.find(filter).sort(sortObj).skip(skip).limit(limit).lean(),
            Expense.countDocuments(filter),
        ]);

        // Compute total of current page results in subunits
        const totalPaise = docs.reduce((sum, d) => sum + d.amount_paise, 0);

        // Compute total of ALL matching results (not just this page)
        const aggResult = await Expense.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: '$amount_paise' } } },
        ]);
        const grandTotalPaise = aggResult.length > 0 ? aggResult[0].total : 0;

        const currency = getCurrency();

        return res.json({
            data: docs.map(formatExpense),
            meta: {
                count: docs.length,
                total_count: totalCount,
                total_pages: Math.ceil(totalCount / limit),
                page,
                limit,
                page_total: fromSubunit(totalPaise),
                page_total_paise: totalPaise,
                grand_total: fromSubunit(grandTotalPaise),
                grand_total_paise: grandTotalPaise,
                currency_symbol: currency.symbol,
                currency_code: currency.code,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ── PUT /expenses/:id ─────────────────────────────────────────────────────────

router.put('/:id', upload.single('receipt'), async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found.' });
        }

        // Ownership check
        if (expense.user_id.toString() !== req.userId) {
            return res.status(403).json({ error: 'You do not own this expense.' });
        }

        // Validate updatable fields (partial update allowed)
        const updates = {};

        if (req.body.amount !== undefined) {
            const n = Number(req.body.amount);
            if (isNaN(n) || n <= 0) {
                return res.status(400).json({ error: 'Amount must be a positive number.' });
            }
            updates.amount_paise = toSubunit(req.body.amount);
        }

        if (req.body.category !== undefined) {
            const cat = req.body.category.toLowerCase().trim();
            if (!ALLOWED_CATEGORIES.includes(cat)) {
                return res.status(400).json({
                    error: `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`,
                });
            }
            updates.category = cat;
        }

        if (req.body.description !== undefined) {
            updates.description = req.body.description.trim();
        }

        if (req.body.date !== undefined) {
            const d = new Date(req.body.date);
            if (isNaN(d.getTime())) {
                return res.status(400).json({ error: 'Date must be a valid date string.' });
            }
            updates.date = d;
        }

        if (req.file) {
            updates.receipt_path = req.file.filename;
        }

        const updated = await Expense.findByIdAndUpdate(req.params.id, updates, {
            new: true,
            runValidators: true,
        });

        return res.json({ data: formatExpense(updated) });
    } catch (err) {
        next(err);
    }
});

// ── DELETE /expenses/:id ──────────────────────────────────────────────────────

router.delete('/:id', async (req, res, next) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ error: 'Expense not found.' });
        }

        // Ownership check
        if (expense.user_id.toString() !== req.userId) {
            return res.status(403).json({ error: 'You do not own this expense.' });
        }

        await Expense.findByIdAndDelete(req.params.id);

        return res.json({ message: 'Expense deleted successfully.' });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
