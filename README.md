# TrackMint: Robust Expense Management System

TrackMint is a production-grade full-stack application designed to demonstrate rigorous engineering standards in financial data management. The project prioritizes architectural integrity, monetary correctness, and system reliability over feature breadth.

---

## 🌐 Live Infrastructure

*   **Frontend (SPA)**: [https://trackmint-psi.vercel.app/](https://trackmint-psi.vercel.app/)
*   **Backend (API Health)**: [https://trackmint-api.onrender.com/health](https://trackmint-api.onrender.com/health)

---

## 🧾 Problem Context: The Reliability Gap

In distributed systems, the "at-least-once" delivery nature of network protocols poses a significant risk to financial integrity. Common failure modes include:
1. **Double Submission**: A user clicks "Submit" twice due to UI lag.
2. **Network Retries**: A client-side timeout occurs after the server has processed the request but before the response is received; the client (or an intermediate proxy) automatically retries the request.
3. **Browser Refresh**: A user refreshes the page during an inflight POST request.

Without explicit idempotency controls, these scenarios lead to duplicate expense records, corrupting the user's financial state. TrackMint solves this by implementing a deterministic idempotency layer.

---

## 🏗 Architecture Overview

The system follows a classic three-tier architecture designed for horizontal scalability and stateless execution:

1. **Presentation Layer (Frontend)**: A React SPA (Vite) that manages optimistic UI updates and generates client-side idempotency keys.
2. **Logic Layer (Backend)**: A stateless Node.js/Express REST API. It performs validation, enforces business logic, and manages the idempotency lifecycle.
3. **Data Layer (Database)**: MongoDB Atlas serves as the primary persistence engine, utilized for its flexible schema and atomic operations.

**Data Flow**:
`Client (Idempotency-Key) → Backend (Middleware Check) → Database (Atomic Transaction) → Backend (Cache Result) → Client`

---

## � Folder Structure

```text
TrackMint/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and environment initialization
│   │   ├── middleware/     # Idempotency, Auth, and Error handling logic
│   │   ├── models/         # Mongoose schemas (User, Expense, IdempotencyKey)
│   │   ├── routes/         # RESTful endpoint definitions
│   │   └── server.js       # Application entry point
│   └── tests/              # Integration and unit tests
├── frontend/
│   ├── src/
│   │   ├── api/            # API client abstraction with interceptors
│   │   ├── components/     # Functional UI components
│   │   ├── context/        # Global state management
│   │   └── hooks/          # Subscriptions to expense data
└── DEPLOY.md               # Technical deployment manual
```

---

## 🗄 Database Schema

### User Model
Stores identity and preferences. Passwords are never stored in plaintext.
- `fullName`: String
- `email`: String (Unique, Indexed)
- `password_hash`: String (Bcrypt)
- `monthlyBudget`: Number (Integer)
- `currency`: String (ISO 4217)

### Expense Model
Scoped per user. Stores amounts in subunits.
- `user_id`: ObjectId (Indexed)
- `amount_paise`: Number (Positive Integer)
- `category`: String (Enum)
- `description`: String
- `date`: Date
- `receipt_path`: String (Optional)

### Idempotency Model
Manages request de-duplication.
- `key`: String (Unique Index)
- `user_id`: ObjectId
- `response_code`: Number
- `response_body`: Object
- `expires_at`: Date (TTL Index)

---

## 🔐 Idempotency Design

The backend implements a middleware-based idempotency pattern using the `Idempotency-Key` header (standardized as a UUID v4).

1. **Verification**: Upon receiving a POST request, the middleware queries the `idempotency_keys` collection.
2. **Cache Hit**: If the key exists, the server immediately returns the cached `response_body` and `response_code` without re-executing business logic.
3. **Cache Miss**:
    *   The business logic proceeds.
    *   On successful completion, the response is persisted to the idempotency collection.
    *   An atomic operation ensures that even if the network fails during the response phase, subsequent retries will receive the cached result.
4. **Lifecycle**: Records are automatically purged after 24 hours via a MongoDB TTL index to prevent unbounded storage growth.

---

## 💰 Safe Money Handling

TrackMint utilizes a **Subunit Integer Pattern** for all monetary transactions.

*   **The Risk**: Floating-point math (e.g., `0.1 + 0.2`) in JavaScript leads to precision errors (e.g., `0.30000000000000004`), which are unacceptable in financial systems.
*   **The Solution**: All values are converted to the smallest currency subunit (e.g., Paise for INR, Cents for USD) immediately upon entry.
*   **Implementation**:
    *   Database storage: `amount_paise: 5000` (representing 50.00).
    *   Computation: All totals and aggregations are performed via integer addition using MongoDB's `$sum` operator.
    *   Formatting: Values are divided by the currency factor (100) only at the presentation layer for display.

---

## � API Endpoints

### Authentication
*   `POST /auth/register`: Create user account and return JWT.
*   `POST /auth/login`: Authenticate and return JWT.
*   `GET /auth/me`: Retrieve current authenticated profile.

### Expenses
*   `GET /expenses`: Retrieve paginated expenses.
    *   Query Params: `page`, `limit`, `category`, `sort` (date_desc/date_asc).
*   `POST /expenses`: Create an expense.
    *   **Required Header**: `Idempotency-Key: <UUID>`
*   `PUT /expenses/:id`: Update an existing record.
*   `DELETE /expenses/:id`: Remove a record.

---

## ⚖️ Key Design Decisions

1. **Stateless JWT Auth**: Enables horizontal scaling by removing the need for session affinity or shared session stores (e.g., Redis).
2. **Standardized Error Responses**: All API errors follow a `{ error: "Message" }` structure with appropriate HTTP status codes (400, 401, 403, 409, 500).
3. **Strict Category Enums**: Enforced at the database level to ensure data consistency for filtering and reporting.
4. **Environment-Driven Configuration**: Sensitive data and regional settings (Currency, Timeouts) are managed strictly via environment variables.

---

## ⚠️ Trade-offs

1. **Disk Storage for Uploads**: Receipts are stored locally in the `uploads/` directory. While suitable for single-instance deployments, a multi-instance production environment would require a migration to an object store like AWS S3 or Google Cloud Storage.
2. **No Refresh Tokens**: For the scope of this project, a 7-day JWT expiration was chosen for simplicity. Production systems with stricter security requirements should implement short-lived access tokens combined with secure refresh token rotation.
3. **Client-Side Key Generation**: Trusting the client to generate the `Idempotency-Key` is standard but requires the backend to scope these keys per user to prevent cross-account key collisions.

---

## � Deployment Instructions

### Prerequisites
*   Node.js 18+
*   A MongoDB Atlas Cluster (Replica Set required for transactions)

### Environment Variables
**Backend (`.env`):**
*   `MONGODB_URI`: Connection string
*   `JWT_SECRET`: Secure signing key
*   `CORS_ORIGINS`: Allowed frontend origins (comma-separated or `*`)
*   `NODE_ENV`: `production` or `development`

**Frontend (`.env`):**
*   `VITE_API_BASE_URL`: URL of the deployed backend

### Deployment Steps
1.  **Backend (Render/Railway/Heroku)**: Set root directory to `backend`, run `npm install`, and start via `npm start`.
2.  **Frontend (Vercel/Netlify)**: Set root directory to `frontend`, select the Vite preset, and ensure `VITE_API_BASE_URL` points to the live backend.

---

## 🧪 Testing Instructions

### Local Execution
1.  `npm install` in both directories.
2.  `npm run dev` in both directories.

### Idempotency Verification
1.  Capture a `POST /expenses` request using a tool like Postman or `curl`.
2.  Maintain the same `Idempotency-Key` header.
3.  Execute the request multiple times.
4.  Observe that the backend returns the same response immediately and no duplicate records are created in the database.

---

## � Future Improvements
*   Pagination
*   Analytics
*   Role-based auth
*   Multi-currency
