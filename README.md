# 💎 TrackMint — Premium Expense Management

A production-ready, full-stack expense tracking application with a focus on **Visual Excellence (Premium Light Theme)**, **Robust Architecture**, and **Financial Realism**. 

Built with the **MERN** stack (MongoDB, Express, React, Node) and styled with a minimal, high-end aesthetic inspired by Apple, Notion, and Linear.

---

## ✨ Key Features (v2.0)

### 🎨 Premium UI/UX
- **Design System**: A sleek, minimal light theme using a refined color palette (`#F8FAFC` background, emerald accents).
- **Typography**: Optimized readability with modern sans-serif scales (Inter).
- **Responsiveness**: Fully fluid layout that works beautifully from mobile to desktop.
- **Glassmorphism**: Subtle shadows and clean borders for a depth-rich experience.

### 🔐 Production-Ready Auth
- **Enhanced Signup**: Collects `Full Name`, `Email`, `Monthly Budget`, and `Currency` (INR/USD/EUR).
- **Security**: 
  - Password hashing via `bcrypt` (12 rounds).
  - Secure JWT authentication.
  - Rate limiting and `helmet` protection.
- **UX**: Real-time validation, password strength indicators, and helpful toasts.

### 📊 Financial Insights
- **Budget Tracking**: A dynamic **Budget Progress Bar** that visualizes spending vs. your monthly target.
- **Currency Intelligence**: Support for multiple currencies with automatic subunit handling (e.g., Paise/Cents).
- **Activity Summary**: Instant overview of your total balance, transaction count, and average spend.

### 🛡️ Enterprise-Grade Backend
- **Idempotent APIs**: Prevents double-charging or duplicate entries using `Idempotency-Key` headers.
- **File Management**: Secure receipt uploads for transaction proof.
- **Data Integrity**: Global error handling, structured logging, and strict Mongoose schemas.

---

## 🛠️ Tech Stack

| Layer      | Technology                                |
|------------|-------------------------------------------|
| **Frontend** | React 18, Vite 6, React-Hot-Toast         |
| **Backend**  | Node.js, Express 4, Multer (Uploads)      |
| **Database** | MongoDB Atlas (Mongoose 8)                |
| **Security** | JWT, bcrypt, Helmet, Rate-Limit, CORS     |
| **Styles**   | Vanilla CSS (Systematic Token-based)      |

---

## 🚀 Live Demo

- **Frontend**: [https://trackmint-psi.vercel.app/](https://trackmint-psi.vercel.app/)
- **Backend**: [https://trackmint-api.onrender.com/health](https://trackmint-api.onrender.com/health)

---

## 💻 Local Setup

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (for the replica set supporting transactions)

### 2. Install Dependencies
```bash
# Clone the repository
git clone https://github.com/SurajMnnit/TrackMint.git
cd TrackMint

# Backend setup
cd backend
npm install
cp .env.example .env # Update with your MONGODB_URI and JWT_SECRET

# Frontend setup
cd ../frontend
npm install
cp .env.example .env # Set VITE_API_BASE_URL to http://localhost:3001
```

### 3. Run Development Servers
```bash
# In backend/
npm run dev

# In frontend/
npm run dev
```

---

## 📂 Folder Structure

```
TrackMint/
├── backend/
│   ├── src/
│   │   ├── config/      ← Database & Currency settings
│   │   ├── middleware/  ← Auth, Error Handling, Idempotency
│   │   ├── models/      ← User & Expense Schemas
│   │   ├── routes/      ← Auth & Expense Endpoints
│   │   └── server.js    ← Express entry point
├── frontend/
│   ├── src/
│   │   ├── components/  ← Modular UI Elements
│   │   ├── context/     ← Auth & Global State
│   │   ├── api/         ← Axios/Fetch Client abstraction
│   │   ├── hooks/       ← Data fetching logic
│   │   └── index.css    ← Design System & Global Styles
└── DEPLOY.md            ← Production Deployment Guide
```

---

## 📜 License
Licensed under the [MIT License](LICENSE).
