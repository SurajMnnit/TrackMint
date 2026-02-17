/**
 * Integration tests for TrackMint v2 API.
 *
 * These tests require a running MongoDB instance.
 * Set TEST_MONGODB_URI env var or defaults to mongodb://localhost:27017/trackmint_test
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

// Set test env vars BEFORE requiring the app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/trackmint_test';
process.env.CURRENCY = 'INR';

const { app } = require('../src/server');

let token;
let userId;

beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    // Clean slate
    const collections = await mongoose.connection.db.collections();
    for (const col of collections) {
        await col.deleteMany({});
    }
});

afterAll(async () => {
    // Drop test database
    await mongoose.connection.db.dropDatabase();
    await mongoose.disconnect();
});

// ── Auth Tests ────────────────────────────────────────────────────────────────

describe('POST /auth/register', () => {
    it('should register a new user and return token', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.status).toBe(201);
        expect(res.body.data).toHaveProperty('token');
        expect(res.body.data).toHaveProperty('user');
        expect(res.body.data.user.email).toBe('test@example.com');
        expect(res.body.data.user).not.toHaveProperty('password_hash');
        expect(res.body.data).toHaveProperty('currency');

        token = res.body.data.token;
        userId = res.body.data.user._id;
    });

    it('should reject duplicate email', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'test@example.com', password: 'password456' });

        expect(res.status).toBe(409);
    });

    it('should reject short password', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'test2@example.com', password: '123' });

        expect(res.status).toBe(400);
    });
});

describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('token');
        token = res.body.data.token; // Use fresh token
    });

    it('should reject invalid password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'test@example.com', password: 'wrong' });

        expect(res.status).toBe(401);
    });
});

describe('GET /auth/me', () => {
    it('should return current user', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.user.email).toBe('test@example.com');
    });

    it('should reject missing token', async () => {
        const res = await request(app).get('/auth/me');
        expect(res.status).toBe(401);
    });
});

// ── Expense Tests ─────────────────────────────────────────────────────────────

describe('POST /expenses', () => {
    it('should create an expense', async () => {
        const idemKey = uuidv4();
        const res = await request(app)
            .post('/expenses')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', idemKey)
            .send({
                amount: 49.99,
                category: 'food',
                description: 'Lunch',
                date: '2026-02-15',
            });

        expect(res.status).toBe(201);
        expect(res.body.data.amount).toBe('49.99');
        expect(res.body.data.amount_paise).toBe(4999);
        expect(res.body.data.category).toBe('food');
        expect(res.body.data.currency_symbol).toBe('₹');
    });

    it('should be idempotent with same key', async () => {
        const idemKey = uuidv4();

        const res1 = await request(app)
            .post('/expenses')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', idemKey)
            .send({
                amount: 100,
                category: 'transport',
                description: 'Cab ride',
                date: '2026-02-14',
            });

        const res2 = await request(app)
            .post('/expenses')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', idemKey)
            .send({
                amount: 100,
                category: 'transport',
                description: 'Cab ride',
                date: '2026-02-14',
            });

        expect(res1.status).toBe(201);
        expect(res2.status).toBe(201);
        expect(res1.body.data.id).toBe(res2.body.data.id); // Same expense
    });

    it('should reject missing Idempotency-Key', async () => {
        const res = await request(app)
            .post('/expenses')
            .set('Authorization', `Bearer ${token}`)
            .send({
                amount: 20,
                category: 'food',
                description: 'Snack',
                date: '2026-02-15',
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toMatch(/Idempotency/i);
    });

    it('should reject negative amount', async () => {
        const res = await request(app)
            .post('/expenses')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', uuidv4())
            .send({
                amount: -10,
                category: 'food',
                description: 'Invalid',
                date: '2026-02-15',
            });

        expect(res.status).toBe(400);
    });

    it('should reject unauthenticated requests', async () => {
        const res = await request(app)
            .post('/expenses')
            .set('Idempotency-Key', uuidv4())
            .send({
                amount: 10,
                category: 'food',
                description: 'No token',
                date: '2026-02-15',
            });

        expect(res.status).toBe(401);
    });
});

describe('GET /expenses', () => {
    it('should list expenses', async () => {
        const res = await request(app)
            .get('/expenses')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(res.body.meta).toBeDefined();
        expect(res.body.meta.grand_total).toBeDefined();
    });

    it('should filter by category', async () => {
        const res = await request(app)
            .get('/expenses?category=food')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        res.body.data.forEach((e) => expect(e.category).toBe('food'));
    });

    it('should sort by date ascending', async () => {
        const res = await request(app)
            .get('/expenses?sort=date_asc')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        const dates = res.body.data.map((e) => new Date(e.date).getTime());
        for (let i = 1; i < dates.length; i++) {
            expect(dates[i]).toBeGreaterThanOrEqual(dates[i - 1]);
        }
    });

    it('should paginate', async () => {
        const res = await request(app)
            .get('/expenses?page=1&limit=1')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(1);
        expect(res.body.meta.page).toBe(1);
        expect(res.body.meta.limit).toBe(1);
        expect(res.body.meta.total_pages).toBeGreaterThanOrEqual(2);
    });
});

let createdExpenseId;

describe('PUT /expenses/:id', () => {
    beforeAll(async () => {
        const res = await request(app)
            .post('/expenses')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', uuidv4())
            .send({
                amount: 75,
                category: 'shopping',
                description: 'Shoes',
                date: '2026-02-10',
            });
        createdExpenseId = res.body.data.id;
    });

    it('should update an expense', async () => {
        const res = await request(app)
            .put(`/expenses/${createdExpenseId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: 80, description: 'Running shoes' });

        expect(res.status).toBe(200);
        expect(res.body.data.amount).toBe('80.00');
        expect(res.body.data.description).toBe('Running shoes');
    });

    it('should reject invalid amount', async () => {
        const res = await request(app)
            .put(`/expenses/${createdExpenseId}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ amount: -5 });

        expect(res.status).toBe(400);
    });
});

describe('DELETE /expenses/:id', () => {
    it('should delete an expense', async () => {
        const res = await request(app)
            .delete(`/expenses/${createdExpenseId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.message).toMatch(/deleted/i);
    });

    it('should return 404 for deleted expense', async () => {
        const res = await request(app)
            .delete(`/expenses/${createdExpenseId}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });
});

// ── Isolation Test (one user can't see/edit another's expenses) ───────────────

describe('User isolation', () => {
    let token2;
    let user1ExpenseId;

    beforeAll(async () => {
        // Create first user's expense
        const expRes = await request(app)
            .post('/expenses')
            .set('Authorization', `Bearer ${token}`)
            .set('Idempotency-Key', uuidv4())
            .send({
                amount: 500,
                category: 'rent',
                description: 'Isolation test',
                date: '2026-02-01',
            });
        user1ExpenseId = expRes.body.data.id;

        // Register second user
        const authRes = await request(app)
            .post('/auth/register')
            .send({ email: 'user2@example.com', password: 'password123' });
        token2 = authRes.body.data.token;
    });

    it('user2 should not see user1 expenses', async () => {
        const res = await request(app)
            .get('/expenses')
            .set('Authorization', `Bearer ${token2}`);

        expect(res.status).toBe(200);
        expect(res.body.data.length).toBe(0);
    });

    it('user2 should not be able to edit user1 expense', async () => {
        const res = await request(app)
            .put(`/expenses/${user1ExpenseId}`)
            .set('Authorization', `Bearer ${token2}`)
            .send({ amount: 1 });

        expect(res.status).toBe(403);
    });

    it('user2 should not be able to delete user1 expense', async () => {
        const res = await request(app)
            .delete(`/expenses/${user1ExpenseId}`)
            .set('Authorization', `Bearer ${token2}`);

        expect(res.status).toBe(403);
    });
});
