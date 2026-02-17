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
        const { email, password, fullName, monthlyBudget, currency } = req.body;

        if (!email || !password || !fullName) {
            return res.status(400).json({ error: 'Email, password, and full name are required.' });
        }
        if (typeof fullName !== 'string' || fullName.trim().length < 3) {
            return res.status(400).json({ error: 'Full name must be at least 3 characters.' });
        }
        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters.' });
        }

        // Check for existing user
        const existing = await User.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            return res.status(409).json({ error: 'An account with this email already exists.' });
        }

        const user = new User({
            fullName: fullName.trim(),
            email: email.toLowerCase().trim(),
            password_hash: password,
            monthlyBudget: monthlyBudget ? Number(monthlyBudget) : null,
            currency: currency || 'INR',
        });
        await user.save();

        const token = signToken(user._id);
        const configCurrency = getCurrency();

        res.status(201).json({
            data: {
                user: user.toJSON(),
                token,
                currency: configCurrency,
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

// ── PUT /auth/profile ─────────────────────────────────────────────────────────

router.put('/profile', requireAuth, async (req, res, next) => {
    try {
        const { fullName, monthlyBudget, currency, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // 1. Basic fields
        if (fullName) {
            if (fullName.trim().length < 3) return res.status(400).json({ error: 'Full name too short.' });
            user.fullName = fullName.trim();
        }

        if (monthlyBudget !== undefined) {
            user.monthlyBudget = monthlyBudget === '' ? null : Number(monthlyBudget);
        }

        if (currency) {
            if (!['INR', 'USD', 'EUR'].includes(currency)) return res.status(400).json({ error: 'Invalid currency.' });
            user.currency = currency;
        }

        // 2. Password change (optional)
        if (newPassword) {
            if (!currentPassword) return res.status(400).json({ error: 'Current password required to change password.' });
            const valid = await user.comparePassword(currentPassword);
            if (!valid) return res.status(401).json({ error: 'Incorrect current password.' });
            if (newPassword.length < 8) return res.status(400).json({ error: 'New password must be at least 8 characters.' });
            user.password_hash = newPassword; // Hashed by pre-save hook
        }

        await user.save();
        res.json({ data: { user: user.toJSON() } });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
