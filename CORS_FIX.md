# CORS Fix - Render Backend Configuration

## Problem Fixed ✅

- Backend was returning CORS headers with trailing slashes
- Browser origin didn't include trailing slash
- Mismatch caused CORS to block all requests

## Solution

- Normalized CORS validation (removes trailing slashes)
- Updated both Express and Socket.io CORS configs
- Added support for all deployment scenarios

## Render Backend Setup

### Step 1: Set Environment Variables on Render

Go to your Render service → Settings → Environment

Add/Update these variables:

```
CLIENT_URL=https://code-collaborator-5gvm.vercel.app
DATABASE_URL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
MONGO_URI=your_mongodb_uri
NODE_ENV=production
```

**IMPORTANT:** Do NOT include trailing slash in `CLIENT_URL`

### Step 2: Redeploy Backend

After setting env vars:

1. Go to Render Dashboard
2. Find your service: `codecollaborator-6c4s`
3. Click "Manual Deploy" → "Latest Commit"
4. Wait for deployment to complete

### Step 3: Verify Backend is Running

Test the API is accessible:

```
https://codecollaborator-6c4s.onrender.com/api/auth/me
```

Should return 401 (unauthorized) if working, not 403/CORS error

### Step 4: Update Frontend if Needed

Verify your Vercel frontend has:

**Settings → Environment Variables:**

```
VITE_SERVER_URL=https://codecollaborator-6c4s.onrender.com
```

Then redeploy frontend on Vercel.

## How the Fix Works

### Before (Broken)

```
Backend sets: Access-Control-Allow-Origin: https://code-collaborator-5gvm.vercel.app/
Browser sends: Origin: https://code-collaborator-5gvm.vercel.app
Result: ❌ MISMATCH - CORS blocked
```

### After (Fixed)

```
Backend normalizes origin by removing trailing slashes
Backend sets: Access-Control-Allow-Origin: https://code-collaborator-5gvm.vercel.app
Browser sends: Origin: https://code-collaborator-5gvm.vercel.app
Result: ✅ MATCH - Request allowed
```

## Troubleshooting

### Still getting CORS errors?

1. **Check backend env var:**

   ```
   On Render Dashboard, verify CLIENT_URL does NOT have trailing slash
   ```

2. **Clear cache and restart:**
   - Clear browser cache (Ctrl+Shift+Delete)
   - Close all tabs
   - Open fresh tab
   - Try logging in again

3. **Check logs on Render:**
   - Render Dashboard → Your Service → Logs
   - Look for error messages

4. **Verify frontend URL:**
   - Make sure you're actually using `code-collaborator-5gvm.vercel.app`
   - Not `localhost` or different domain

5. **Test OPTIONS request:**

   ```bash
   curl -i -X OPTIONS \
   -H "Origin: https://code-collaborator-5gvm.vercel.app" \
   -H "Access-Control-Request-Method: POST" \
   -H "Access-Control-Request-Headers: Content-Type" \
   https://codecollaborator-6c4s.onrender.com/api/auth/login
   ```

   Should return headers including `Access-Control-Allow-Origin`

## Files Modified

- ✅ `/server/src/app.js` - Enhanced CORS validation
- ✅ `/server/src/socket/index.js` - Enhanced Socket.io CORS

## Next: Deploy and Test

1. Redeploy backend on Render
2. Redeploy frontend on Vercel
3. Test login at: `https://code-collaborator-5gvm.vercel.app/login`
