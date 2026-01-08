# API Configuration Guide

## 🔄 How API Routing Works

This application uses Next.js rewrites to proxy API requests from frontend to backend. Understanding the flow is crucial for proper configuration.

## 📊 Request Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ http://localhost:3000/api/v1/auth/login
       │
       ▼
┌──────────────────────┐
│   Next.js Frontend   │
│   (Port 3000)        │
└──────┬───────────────┘
       │ Rewrites Rule: /api/:path* → http://localhost:3001/api/:path*
       │
       ▼
┌──────────────────────┐
│   Backend API        │
│   (Port 3001)        │
│   Route: /api/v1/*   │
└──────────────────────┘
```

## ⚙️ Configuration Explained

### Development Environment

**Frontend `.env`:**
```env
# IMPORTANT: Point to FRONTEND URL, not backend!
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_PREFIX=/api/v1

# WebSocket connects directly to backend
NEXT_PUBLIC_WS_URL=localhost:3001
```

**Backend `.env`:**
```env
PORT=3001
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000
```

**Next.js `next.config.mjs`:**
```javascript
async rewrites() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return [
    {
      source: '/api/:path*',
      destination: `${backendUrl}/api/:path*`,
    },
  ];
}
```

### How It Works

1. **Frontend makes API call:**
   ```typescript
   // In src/lib/api-client.ts
   const url = `${API_URL}${API_PREFIX}${endpoint}`;
   // Becomes: http://localhost:3000/api/v1/auth/login
   ```

2. **Next.js rewrites the request:**
   - Source: `/api/v1/auth/login`
   - Destination: `http://localhost:3001/api/v1/auth/login`

3. **Backend receives request:**
   - Backend listening on port 3001
   - Route matches: `/api/v1/auth/login`
   - ✅ Success!

### ❌ Common Mistakes

#### Mistake 1: Pointing to Backend URL

```env
# ❌ WRONG - This causes double prefix
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Result:**
```
Frontend constructs: http://localhost:3001/api/v1/auth/login
Next.js rewrites to:   http://localhost:3001/api/v1/auth/login (no change)
Request hits:          /api/v1/api/v1/auth/login
Backend returns:       404 Not Found ❌
```

#### Mistake 2: Missing API_PREFIX

```env
# ❌ WRONG - Endpoint won't match
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_API_PREFIX=
```

**Result:**
```
Frontend constructs: http://localhost:3000/auth/login
Next.js rewrites to:   http://localhost:3001/auth/login
Request hits:          /auth/login (should be /api/v1/auth/login)
Backend returns:       404 Not Found ❌
```

## 🚀 Production Deployment

### Option 1: Using Next.js Proxy (Recommended)

**Frontend `.env.production`:**
```env
NEXT_PUBLIC_API_URL=https://yourdomain.com
NEXT_PUBLIC_API_PREFIX=/api/v1
NEXT_PUBLIC_WS_URL=yourdomain.com  # Auto-detects wss://
```

**Backend `.env`:**
```env
PORT=3001
CORS_ORIGIN=https://yourdomain.com
```

**Nginx Configuration:**
```nginx
upstream nextjs {
    server localhost:3000;
}

upstream backend {
    server localhost:3001;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # All requests go to Next.js
    # Next.js rewrites /api/* to backend
    location / {
        proxy_pass http://nextjs;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket direct to backend (bypass Next.js)
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

**Flow:**
```
Browser → Nginx (yourdomain.com) → Next.js (3000) → Backend (3001)
                                  ↓
                    WebSocket → Backend (3001) directly
```

### Option 2: Separate Frontend/Backend Domains

**Frontend `.env.production`:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_API_PREFIX=/api/v1
NEXT_PUBLIC_WS_URL=api.yourdomain.com
```

**Backend `.env`:**
```env
PORT=3001
CORS_ORIGIN=https://yourdomain.com,https://api.yourdomain.com
```

**Disable Next.js rewrites in `next.config.mjs`:**
```javascript
async rewrites() {
  // Only use rewrites in development
  if (process.env.NODE_ENV === 'development') {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:3001/api/:path*',
      },
    ];
  }
  return [];
}
```

**Nginx Configuration:**
```nginx
# Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
    }
}

# Backend API
server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
    }

    # WebSocket
    location /ws/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
```

**Flow:**
```
Browser → yourdomain.com → Next.js (3000)
       → api.yourdomain.com → Backend (3001)
```

## 🔍 Debugging

### Check Current Configuration

```bash
# Frontend - Check what URL is being used
echo $NEXT_PUBLIC_API_URL
echo $NEXT_PUBLIC_API_PREFIX

# Backend - Check port
echo $PORT
```

### Test API Endpoint

```bash
# Direct backend test
curl http://localhost:3001/api/v1/auth/me

# Through Next.js proxy
curl http://localhost:3000/api/v1/auth/me
```

### Common Issues

#### Issue: `404 /api/v1/api/v1/auth/login`

**Solution:** Change `NEXT_PUBLIC_API_URL` to point to frontend (localhost:3000), not backend

#### Issue: CORS Error

**Solution:** Ensure backend `CORS_ORIGIN` includes frontend domain

#### Issue: WebSocket Connection Failed

**Solution:**
- Check `NEXT_PUBLIC_WS_URL` points to backend
- Ensure protocol is correct (ws:// for http, wss:// for https)

#### Issue: Proxy Not Working

**Solution:**
1. Restart Next.js dev server after changing `.env`
2. Clear browser cache
3. Check `next.config.mjs` rewrites configuration

## 📝 Environment Variables Summary

| Variable | Purpose | Development | Production |
|----------|---------|-------------|------------|
| `NEXT_PUBLIC_API_URL` | Base API URL | `http://localhost:3000` | `https://yourdomain.com` |
| `NEXT_PUBLIC_API_PREFIX` | API path prefix | `/api/v1` | `/api/v1` |
| `NEXT_PUBLIC_WS_URL` | WebSocket host | `localhost:3001` | `yourdomain.com` |
| Backend `PORT` | Backend port | `3001` | `3001` |
| Backend `CORS_ORIGIN` | Allowed origins | `http://localhost:3000` | `https://yourdomain.com` |

## 🎯 Quick Setup

### Development

1. **Backend** (`backend/.env`):
   ```env
   PORT=3001
   CORS_ORIGIN=http://localhost:3000
   ```

2. **Frontend** (`.env`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_API_PREFIX=/api/v1
   NEXT_PUBLIC_WS_URL=localhost:3001
   ```

3. **Start servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend && bun run dev

   # Terminal 2 - Frontend
   bun run dev
   ```

### Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production setup.

---

**Last Updated:** 2026-01-08
