# 🔍 Debug API Routing Issue

## Problem
Request going to `/api/v1/api/v1/auth/login` instead of `/api/v1/auth/login`

## Root Cause Analysis

The double prefix `/api/v1/api/v1` happens when:
1. Frontend constructs URL with prefix: `${API_URL}${API_PREFIX}/auth/login`
2. Next.js rewrites adds another prefix: `${backendUrl}/api/:path*`

## Current Configuration

### Frontend `.env`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_PREFIX=/api/v1
BACKEND_URL=http://localhost:3001
```

### Backend `.env`
```env
PORT=3001
API_PREFIX=/api/v1
```

### Next.js `next.config.mjs`
```javascript
async rewrites() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3001';
  return [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
  ];
}
```

## Expected Flow

```
Browser calls:
  → http://localhost:3000/api/v1/auth/login

Next.js receives:
  → /api/v1/auth/login
  → Matches source: /api/:path* (where :path* = v1/auth/login)

Next.js rewrites to:
  → http://localhost:3001/api/v1/auth/login ✅

Backend receives:
  → /api/v1/auth/login
  → Route: app.route('/api/v1/auth', authRouter)
  → authRouter.post('/login')
  → Final: /api/v1/auth/login ✅
```

## 🔧 Fix Steps

### Step 1: Stop All Servers
```bash
# Stop frontend (Ctrl+C in terminal running dev server)
# Stop backend (Ctrl+C in backend terminal)
```

### Step 2: Clear Next.js Cache
```bash
# In /Users/kurnia/Sites/chat-ui
rm -rf .next
rm -rf node_modules/.cache
```

### Step 3: Verify Environment Variables
```bash
# Check frontend env
cat .env | grep NEXT_PUBLIC

# Expected output:
# NEXT_PUBLIC_API_URL=http://localhost:3000
# NEXT_PUBLIC_API_PREFIX=/api/v1
# NEXT_PUBLIC_WS_URL=localhost:3001
```

### Step 4: Restart Backend
```bash
cd backend
bun run dev

# Wait for "Server is running on http://localhost:3001"
```

### Step 5: Test Backend Directly
```bash
# In new terminal
curl http://localhost:3001/api/v1/auth/me

# Expected: {"success":false,"message":"Token tidak ditemukan..."}
# This confirms backend is working at /api/v1/*
```

### Step 6: Restart Frontend
```bash
# In /Users/kurnia/Sites/chat-ui
bun run dev

# Wait for "Ready in X ms"
```

### Step 7: Test Through Proxy
```bash
# In new terminal
curl http://localhost:3000/api/v1/auth/me

# Expected: Same response as Step 5
# This confirms Next.js proxy is working
```

### Step 8: Check Browser Network Tab
1. Open browser DevTools (F12)
2. Go to Network tab
3. Try login
4. Check request URL - should be `http://localhost:3000/api/v1/auth/login`

## 🚨 If Still Failing

### Check Browser Cache
1. Open DevTools (F12)
2. Right-click Reload button
3. Select "Empty Cache and Hard Reload"

### Check Environment Variables in Runtime
Add this to `src/lib/api-client.ts` temporarily:
```typescript
console.log('API_URL:', API_URL);
console.log('API_PREFIX:', API_PREFIX);
```

Expected output in browser console:
```
API_URL: http://localhost:3000
API_PREFIX: /api/v1
```

### Verify Next.js Rewrites
Check `.next/routes-manifest.json` after build:
```bash
cat .next/routes-manifest.json | grep -A 5 rewrites
```

### Check Backend Logs
Backend should show:
```
<-- POST /api/v1/auth/login
```

NOT:
```
<-- POST /api/v1/api/v1/auth/login  ❌
```

## 🎯 Quick Test Script

```bash
#!/bin/bash

echo "=== Testing API Configuration ==="

echo -e "\n1. Backend Direct Test:"
curl -s http://localhost:3001/api/v1/auth/me | head -c 100
echo ""

echo -e "\n2. Frontend Proxy Test:"
curl -s http://localhost:3000/api/v1/auth/me | head -c 100
echo ""

echo -e "\n3. Environment Check:"
echo "NEXT_PUBLIC_API_URL: $(grep NEXT_PUBLIC_API_URL .env | cut -d '=' -f2)"
echo "NEXT_PUBLIC_API_PREFIX: $(grep NEXT_PUBLIC_API_PREFIX .env | cut -d '=' -f2)"
echo "BACKEND_URL: $(grep BACKEND_URL .env | cut -d '=' -f2)"

echo -e "\n4. Server Status:"
echo "Backend (3001): $(lsof -i :3001 -t > /dev/null && echo 'Running ✅' || echo 'Stopped ❌')"
echo "Frontend (3000): $(lsof -i :3000 -t > /dev/null && echo 'Running ✅' || echo 'Stopped ❌')"
```

Save as `test-api.sh`, make executable:
```bash
chmod +x test-api.sh
./test-api.sh
```

## 📝 Common Issues

### Issue: Environment variables not updating
**Solution:** Restart Next.js dev server (it caches env vars)

### Issue: Rewrites not working
**Solution:**
1. Delete `.next` folder
2. Restart dev server

### Issue: CORS error
**Solution:** Check backend `CORS_ORIGIN=http://localhost:3000`

### Issue: 404 on all routes
**Solution:** Ensure backend is running on port 3001

---

After following these steps, the login should work at:
`http://localhost:3000/api/v1/auth/login` → Backend `/api/v1/auth/login` ✅
