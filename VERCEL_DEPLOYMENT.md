# Vercel Deployment Guide

## Issues Fixed ✅

1. **Client SPA Routing (404 on /login)** - Added `vercel.json` with rewrites
2. **API Connection** - Added backend CORS support for Vercel domains
3. **Favicon** - Updated index.html with fallback favicon support

## Setup Steps

### 1. Deploy Backend to Vercel

```bash
cd server
vercel deploy
```

After deployment, note your backend URL: `https://your-backend-name.vercel.app`

### 2. Add Backend Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=https://your-frontend-name.vercel.app
NODE_ENV=production
```

### 3. Deploy Frontend to Vercel

```bash
cd client
vercel deploy
```

### 4. Add Frontend Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

```
VITE_SERVER_URL=https://your-backend-name.vercel.app
```

Replace `your-backend-name` with your actual backend Vercel domain.

### 5. Trigger Redeploy

- Frontend: After setting env vars, redeploy from Vercel dashboard
- Backend: After setting env vars, redeploy from Vercel dashboard

## Files Created/Modified

| File                                     | Purpose                                           |
| ---------------------------------------- | ------------------------------------------------- |
| `/vercel.json`                           | Frontend SPA routing config                       |
| `/server/vercel.json`                    | Backend serverless config                         |
| `/client/.env.production`                | Frontend production env (update with backend URL) |
| `/server/src/app.js`                     | Updated CORS for Vercel domains                   |
| `/.env.example` & `/server/.env.example` | Environment variable templates                    |

## Troubleshooting

### Still getting 404 on /login

- ✅ Ensure `vercel.json` exists in root
- ✅ Redeploy frontend after changes
- ✅ Clear browser cache (Ctrl+Shift+Delete)

### API endpoints still failing

- ✅ Check `VITE_SERVER_URL` is set correctly in frontend env vars
- ✅ Verify backend is deployed and running
- ✅ Check backend URL is accessible: `https://your-backend.vercel.app/api/auth/me`
- ✅ Ensure CORS is configured (already fixed in app.js)

### WebSocket connection issues

- Socket.io should work with Vercel, but may need additional config if behind proxy
- Check Network tab in DevTools for WebSocket failures

## Testing Locally Before Deployment

```bash
# Build and test frontend locally
cd client
npm run build
npm run preview

# In another terminal, start backend
cd server
npm run test  # or npm start for production
```

Then visit `http://localhost:4173` and test login.
