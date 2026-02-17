# TrackMint — Expense Tracker v2

A production-quality full-stack expense tracker with JWT authentication, MongoDB persistence, idempotent API, receipt uploads, pagination, and currency abstraction.

---

## Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| Frontend   | React 18, Vite 6                          |
| Backend    | Node.js, Express 4                        |
| Database   | MongoDB (Mongoose 8)                      |
| Auth       | JWT (jsonwebtoken, bcrypt)                |
| Uploads    | Multer (disk storage, image-only)         |
| Security   | Helmet, CORS, express-rate-limit          |

---

## Folder Structure

```
TrackMint/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js        ← Mongoose connection
│   │   │   └── currency.js        ← Currency abstraction (INR/USD/EUR/GBP/JPY)
│   │   ├── middleware/
│   │   │   ├── auth.js            ← JWT sign + verify middleware
│   │   │   ├── errorHandler.js    ← Global structured error handler
│   │   │   ├── idempotency.js     ← Idempotency-Key middleware
│   │   │   └── upload.js          ← Multer receipt upload config
│   │   ├── models/
│   │   │   ├── Expense.js         ← Expense schema (amount in subunit paise)
│   │   │   ├── IdempotencyKey.js  ← TTL-based idempotency record
│   │   │   └── User.js            ← User schema with bcrypt hashing
│   │   ├── routes/
│   │   │   ├── auth.js            ← /auth/register, /auth/login, /auth/me
│   │   │   └── expenses.js        ← CRUD: POST, GET, PUT, DELETE /expenses
│   │   └── server.js              ← Express entry point
│   ├── tests/
│   │   └── expenses.test.js       ← Integration tests (Jest + Supertest)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js          ← Base HTTP client with auth + error handling
│   │   │   ├── auth.js            ← Auth API calls
│   │   │   └── expenses.js        ← Expense CRUD API calls
│   │   ├── components/
│   │   │   ├── AuthPage.jsx       ← Login / Register page
│   │   │   ├── ExpenseFilters.jsx ← Category + sort dropdowns
│   │   │   ├── ExpenseForm.jsx    ← New expense form with receipt upload
│   │   │   ├── ExpenseList.jsx    ← Expense list with inline edit & delete
│   │   │   ├── ExpenseSummary.jsx ← Total, count, per-category breakdown
│   │   │   └── Pagination.jsx     ← Page navigation
│   │   ├── context/
│   │   │   └── AuthContext.jsx    ← Auth state (user, token, currency)
│   │   ├── hooks/
│   │   │   └── useExpenses.js     ← Expense state management hook
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

---

## Setup Instructions

### Prerequisites

- **Node.js ≥ 18**
- **MongoDB ≥ 6** (local or Atlas)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd TrackMint

# Backend
cd backend
cp .env.example .env     # edit MONGODB_URI, JWT_SECRET
npm install

# Frontend
cd ../frontend
cp .env.example .env
npm install
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/trackmint
JWT_SECRET=change-this-to-a-strong-random-secret
JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:5173
CURRENCY=INR
IDEMPOTENCY_TTL_SECONDS=86400
MAX_FILE_SIZE_MB=5
UPLOAD_DIR=./uploads
```

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=
```
> Leave empty for development (Vite proxy handles routing). Set to your production backend URL for deployment.

### 3. Run Locally

```bash
# Terminal 1 — Backend
cd backend
npm run dev         # nodemon auto-restart on changes

# Terminal 2 — Frontend
cd frontend
npm run dev         # Vite dev server at http://localhost:5173
```

### 4. Run Tests

```bash
cd backend
npm test            # Jest integration tests (requires MongoDB running)
```

---

## API Documentation

### Authentication

| Method | Endpoint         | Auth | Description                  |
|--------|------------------|------|------------------------------|
| POST   | `/auth/register` | No   | Create account, get JWT      |
| POST   | `/auth/login`    | No   | Authenticate, get JWT        |
| GET    | `/auth/me`       | Yes  | Get current user info        |

**Register/Login Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "data": {
    "user": { "_id": "...", "email": "user@example.com" },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "currency": { "code": "INR", "symbol": "₹", "subunit": "paise", "factor": 100 }
  }
}
```

### Expenses (all require `Authorization: Bearer <token>`)

| Method | Endpoint          | Headers                          | Description                                |
|--------|-------------------|----------------------------------|--------------------------------------------|
| POST   | `/expenses`       | `Idempotency-Key: <uuid>`        | Create expense (optional `receipt` file)   |
| GET    | `/expenses`       | —                                | List expenses (filter, sort, paginate)     |
| PUT    | `/expenses/:id`   | —                                | Update expense (partial, optional receipt) |
| DELETE | `/expenses/:id`   | —                                | Delete expense                             |

**GET Query Parameters:**
| Param      | Example          | Description              |
|------------|------------------|--------------------------|
| `category` | `food`           | Filter by category       |
| `sort`     | `date_desc`      | `date_desc` or `date_asc`|
| `page`     | `1`              | Page number (default: 1) |
| `limit`    | `20`             | Items per page (max 100) |

**POST `/expenses` Request (JSON):**
```json
{
  "amount": 49.99,
  "category": "food",
  "description": "Lunch at café",
  "date": "2026-02-15"
}
```

**POST `/expenses` Request (multipart/form-data for receipt upload):**
```
amount=49.99
category=food
description=Lunch at café
date=2026-02-15
receipt=<file>
```

**GET `/expenses` Response:**
```json
{
  "data": [
    {
      "id": "67123abc...",
      "amount": "49.99",
      "amount_paise": 4999,
      "category": "food",
      "description": "Lunch at café",
      "date": "2026-02-15T00:00:00.000Z",
      "receipt_path": "1708123456-abc.jpg",
      "currency_symbol": "₹",
      "currency_code": "INR",
      "created_at": "2026-02-15T10:30:00.000Z"
    }
  ],
  "meta": {
    "count": 1,
    "total_count": 42,
    "total_pages": 3,
    "page": 1,
    "limit": 20,
    "page_total": "49.99",
    "page_total_paise": 4999,
    "grand_total": "15230.50",
    "grand_total_paise": 1523050,
    "currency_symbol": "₹",
    "currency_code": "INR"
  }
}
```

**Allowed Categories:**
`food`, `transport`, `entertainment`, `utilities`, `health`, `shopping`, `education`, `rent`, `other`

---

## Key Design Decisions

### 1. Safe Money Handling

All monetary values are stored as **integers in the smallest currency subunit** (e.g., paise for INR, cents for USD). The `amount_paise` field is a MongoDB `Number` validated as a positive integer. Conversion between major units (rupees) and subunits (paise) uses `Math.round()` to avoid floating-point drift.

### 2. Idempotency Implementation

Every `POST /expenses` requires an `Idempotency-Key` header (UUID v4). The flow:

1. Client generates a UUID before submission and sends it as a header.
2. Middleware checks the `idempotency_keys` collection for that key.
3. **Key found →** Return the cached response. No new expense is created.
4. **Key not found →** Create the expense and store the idempotency record **atomically in a MongoDB transaction**.
5. Idempotency keys have a TTL index on `expires_at` — MongoDB auto-deletes expired keys (default: 24 hours).

This prevents duplicates from:
- Double clicks (same key)
- Network retries (same key)
- Page refreshes (key generated once per "logical submission")

The frontend generates a new UUID per logical form submission (via `useRef`), and only rotates it after a successful create.

### 3. JWT Authentication

- Passwords hashed with **bcrypt (12 salt rounds)** via a Mongoose pre-save hook.
- JWTs signed with HS256, configurable expiry (default: 7 days).
- Token stored in `localStorage`, sent as `Authorization: Bearer <token>`.
- 401 responses trigger a global `auth:logout` event that clears the token and resets user state.

### 4. User Isolation

Every expense is scoped to a `user_id`. All queries filter by `user_id = req.userId`. Edit and delete operations verify ownership — a user cannot modify another user's expenses (returns 403).

### 5. Currency Abstraction

The `CURRENCY` environment variable (default: `INR`) selects which currency to use. Supported: INR, USD, EUR, GBP, JPY. The currency config is returned in auth responses so the frontend can display the correct symbol. The subunit factor (e.g., 100 for INR/USD, 1 for JPY) is used for all conversions.

### 6. Receipt Uploads

- Multer with disk storage, configurable directory (`UPLOAD_DIR`).
- Only image MIME types accepted: jpeg, png, webp, gif.
- File size limited via `MAX_FILE_SIZE_MB` (default: 5MB).
- Filenames are timestamp-prefixed to avoid collisions.
- Static serving via `/uploads` route.

### 7. Pagination

Server-side pagination with `page` and `limit` params. The response includes `total_count`, `total_pages`, `page_total` (current page sum), and `grand_total` (all matching expenses sum via MongoDB aggregation). The frontend shows a smart page number picker with ellipsis.

---

## Trade-offs

| Decision | Reason |
|----------|--------|
| JWT in localStorage, not httpOnly cookie | Simpler implementation for SPA; acceptable for this scope. A production app might use httpOnly cookies for XSS protection. |
| No refresh tokens | Simplicity. Tokens expire in 7 days. Users just re-login. |
| Disk storage for uploads, not S3/cloud | Works for local dev and single-instance deploy. For multi-instance, swap Multer storage to S3. |
| No email verification | Out of scope. Would add in production. |
| MongoDB transactions require replica set | Transactions (used for idempotency) need a replica set. Standalone MongoDB dev instances can be started as a single-node replica set. MongoDB Atlas provides this by default. |
| Inline edit instead of modal | Keeps the UI simpler; trade-off is less space for editing complex expenses. |

---

## What Was Intentionally Not Implemented

- Email verification / password reset
- Refresh token rotation
- Cloud storage (S3) for receipts
- Export to CSV/PDF
- Charts and analytics
- Budget alerts / spending limits
- Multi-currency per user
- Tags or custom categories
- Mobile app
- E2E tests (Playwright/Cypress)

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npx vercel
```

Environment variable:
```
VITE_API_BASE_URL=https://your-backend.onrender.com
```

### Backend → Render

1. Create a **Web Service** on [Render](https://render.com).
2. Connect your Git repo, set root directory to `backend`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/trackmint
   JWT_SECRET=<strong-random-secret>
   CORS_ORIGINS=https://your-frontend.vercel.app
   CURRENCY=INR
   ```

### Database → MongoDB Atlas

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user and whitelist Render's IP (or allow all: `0.0.0.0/0`).
3. Get the connection string and set as `MONGODB_URI` on Render.
4. Transactions work out of the box on Atlas (replica set enabled).

---

## Health Check

```
GET /health → { "status": "ok", "timestamp": "...", "currency": { ... } }
```

---

## License

MIT
