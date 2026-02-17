/**
 * Authentication routes.
 *
 * POST /auth/register — Create a new user account.
 * POST /auth/login    — Authenticate and receive a JWT.
 * GET  /auth/me       — Return current user info (protected).
 */

const express = require('express');
const User = require('../models/User');
const { signToken, requireAuth } = require('../middleware/auth');
const { getCurrency } = require('../config/currency');

const router = express.Router();

// ── POST /auth/register ───────────────────────────────────────────────────────

router.post('/register', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }
        if (typeof password !== 'string' || password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters.' });
        }

        // Check for existing user
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const user = new User({
            email: email.toLowerCase().trim(),
            password_hash: password, // pre-save hook hashes this
        });
        await user.save();

        const token = signToken(user._id);
        const currency = getCurrency();

        res.status(201).json({
            data: {
                user: user.toJSON(),
                token,
                currency,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ── POST /auth/login ──────────────────────────────────────────────────────────

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const valid = await user.comparePassword(password);
        if (!valid) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = signToken(user._id);
        const currency = getCurrency();

        res.json({
            data: {
                user: user.toJSON(),
                token,
                currency,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const currency = getCurrency();
        res.json({ data: { user: user.toJSON(), currency } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
