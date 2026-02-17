# Deployment Guide — TrackMint v2

This guide explains how to deploy TrackMint to production using **Render** (Backend) and **Vercel** (Frontend).

---

## 🏗 Prerequisites

1.  **MongoDB Atlas**: You already have this set up. Use the connection string in your `.env`.
2.  **GitHub Repository**: Ensure your code is pushed to a GitHub repository.

---

## 1. Backend Deployment (Render)

Render is recommended for basic Node.js APIs.

1.  Go to [Render.com](https://render.com) and create a new **Web Service**.
2.  Connect your GitHub repository.
3.  Configure the service:
    *   **Root Directory**: `backend`
    *   **Environment**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `npm start`
4.  Add **Environment Variables**:
    *   `NODE_ENV`: `production`
    *   `MONGODB_URI`: *Your MongoDB Atlas connection string*
    *   `JWT_SECRET`: *A strong random string*
    *   `CORS_ORIGINS`: `https://your-frontend-domain.vercel.app` (You can update this after deploying the frontend)
    *   `PORT`: `10000` (Render's default)

---

## 2. Frontend Deployment (Vercel)

Vercel is the gold standard for Vite/React apps.

1.  Go to [Vercel.com](https://vercel.com) and **Import** your repository.
2.  Configure the project:
    *   **Root Directory**: `frontend`
    *   **Framework Preset**: `Vite`
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
3.  Add **Environment Variables**:
    *   `VITE_API_BASE_URL`: `https://your-backend-url.onrender.com` (Get this from your Render dashboard)
4.  Deploy!

---

## ⚠️ Important Considerations for Production

### 1. File Uploads (Receipts)
In the current version, receipts are stored in the local `uploads/` folder of the server. On Render/Vercel, the local filesystem is **ephemeral** (files are deleted when the server sleeps or redeploys).
*   **Recommendation**: For a real production app, refactor to use **Cloudinary** or **AWS S3** for image storage.

### 2. Standalone vs Replica Set
The backend uses a fallback for idempotency if MongoDB isn't a replica set. Since you are using **MongoDB Atlas**, it is a replica set, so **Transactions** will work automatically.

### 3. DNS Issues
If you experience DNS issues on Render/Vercel like you did locally, ensure you use the **standard connection string** (the one we fixed in `.env`) rather than the `+srv` one, or check Render's documentation on MongoDB Atlas connectivity.

---

## ✅ Deployment Checklist

- [ ] Backend is running and health check returns `ok` (`/health`).
- [ ] Frontend can communicate with the backend (`VITE_API_BASE_URL` is set).
- [ ] CORS is configured on the backend to allow your frontend domain.
- [ ] JWT secret is changed from the default.
