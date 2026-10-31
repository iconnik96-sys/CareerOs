# CareerOS Founder Console — Vercel Deployment Guide

## 1. Overview
The Founder Console is an independent React + TypeScript + Vite frontend project located in `admin-frontend/`. It can be deployed to Vercel completely independently of the student frontend (`frontend/`) and connects to your existing FastAPI backend on Render.

---

## 2. Vercel Project Configuration

When importing the CareerOS repository into Vercel for the Founder Console:

| Setting | Value |
| :--- | :--- |
| **Project Name** | `careeros-admin` (or custom choice) |
| **Framework Preset** | `Vite` |
| **Root Directory** | `admin-frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

---

## 3. Environment Variables

Configure the following environment variables in the Vercel Project Settings (**Settings -> Environment Variables**):

```ini
# Backend API Base URL (Your existing FastAPI service on Render)
VITE_API_BASE_URL=https://careeros-backend.onrender.com

# Supabase Auth Configuration (For Founder Account Login)
VITE_SUPABASE_URL=https://mkegptssjhjchwcpatnp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Backend CORS Whitelist Configuration

In your Render backend dashboard (**Render Dashboard -> CareerOS Backend -> Environment**), ensure your new Vercel admin URL is present in `ALLOWED_ORIGINS`:

```ini
ALLOWED_ORIGINS=https://careeros.vercel.app,https://careeros.netlify.app,https://careeros-admin.vercel.app
```

The backend code in `backend/main.py` has already been pre-configured with default support for:
- `http://localhost:5174` (Admin console local development)
- `http://localhost:5175`
- `https://careeros-admin.vercel.app`

---

## 5. Single-Page Application (SPA) Routing & Security Headers

The `admin-frontend/vercel.json` file is pre-configured with client-side route rewrites and security headers:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

---

## 6. Local Development Execution

To run the Founder Console locally alongside the backend:

1. **Start the FastAPI Backend** (Port 8000):
   ```powershell
   uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
   ```

2. **Start the Founder Console** (Port 5174):
   ```powershell
   cd admin-frontend
   npm run dev
   ```
   Open `http://localhost:5174` in your browser.

