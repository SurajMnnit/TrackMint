/**
 * TrackMint v2 — Express server entry point.
 *
 * MongoDB + JWT Auth + Idempotency + Receipt Upload
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB } = require('./config/database');
const { getCurrency } = require('./config/currency');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 3001;

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

app.use(
    cors({
        origin(origin, cb) {
            if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
            cb(new Error('CORS: origin not allowed'));
        },
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
        credentials: true,
    })
);

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(
    rateLimit({
        windowMs: 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
        message: { error: 'Too many requests — please try again later.' },
    })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '16kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static uploads ────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads')));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    const currency = getCurrency();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        currency,
    });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);

// ── 404 fallback ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Not found.' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
async function start() {
    await connectDB();

    const server = app.listen(PORT, () => {
        console.log(`✅ TrackMint API v2 running → http://localhost:${PORT}`);
    });

    // Graceful shutdown
    const shutdown = () => {
        console.log('\n🛑 Shutting down…');
        server.close(async () => {
            const mongoose = require('mongoose');
            await mongoose.disconnect();
            process.exit(0);
        });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

if (require.main === module) {
    start();
}

module.exports = { app, start };
