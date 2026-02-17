# 🚀 Deployment Guide — TrackMint v2

This guide walk you through deploying TrackMint to production using **Render** (Backend) and **Vercel** (Frontend).

## 📊 App Status: PRD READY
- ✅ **Secure Auth**: Password hashing + JWT.
- ✅ **Realistic Setup**: Full names, Budgeting, Currency selection.
- ✅ **PRD UI**: Premium minimal light theme (Apple + Notion style).
- ✅ **Validation**: Real-time frontend + Strict backend schema.

---

## 🏗 Prerequisites

1.  **MongoDB Atlas**: Create a cluster at [mongodb.com](https://www.mongodb.com/cloud/atlas).
2.  **GitHub**: Ensure your code is pushed (e.g., `git push origin main`).

---

## 1. Backend Deployment (Render)

1.  Sign up at [Render.com](https://render.com).
2.  Click **New +** → **Web Service**.
3.  Connect your GitHub repo.
4.  **Settings**:
    - **Root Directory**: `backend`
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `npm start`
5.  **Environment Variables**:
    - `NODE_ENV`: `production`
    - `MONGODB_URI`: *Paste your Atlas connection string*
    - `JWT_SECRET`: *Generate a random strong string*
    - `CORS_ORIGINS`: `https://your-app.vercel.app` (Add your frontend URL once deployed)
    - `PORT`: `10000` (Render default)

---

## 2. Frontend Deployment (Vercel)

1.  Sign up at [Vercel.com](https://vercel.com).
2.  Click **Add New** → **Project**.
3.  Import your GitHub repo.
4.  **Settings**:
    - **Root Directory**: `frontend`
    - **Framework Preset**: `Vite`
    - **Build Command**: `npm run build`
    - **Output Directory**: `dist`
5.  **Environment Variables**:
    - `VITE_API_BASE_URL`: `https://your-backend.onrender.com` (Get this from your Render dashboard after it deploys)
6.  **Deploy!**

---

## ⚠️ Ephemeral Storage Notice
TrackMint allows receipt uploads. Currently, these are stored in a local `uploads/` folder.
- **On Render/Vercel**: Local files are deleted whenever the app restarts or redeploys.
- **Production Solution**: For long-term storage, the app should be extended to use **Cloudinary** or **AWS S3**.

---

## ✅ Post-Deployment Checklist
- [ ] Backend is live (`https://your-api.onrender.com/health` returns `ok`).
- [ ] Frontend can login/signup.
- [ ] Budget progress displays correctly on Dashboard.
- [ ] Profile can be edited and saved.
- [ ] **Security**: Ensure your `.env` files are NOT committed to GitHub.
