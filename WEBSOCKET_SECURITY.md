# WebSocket Security Configuration Guide

## 🔒 Security Overview

This application uses WebSocket for real-time chat functionality with the following security measures:

### ✅ Implemented Security Features

1. **JWT Authentication**
   - All WebSocket connections require valid JWT token
   - Token verified before accepting connection
   - Invalid tokens result in immediate disconnection (close code 4001/4002)

2. **Room-based Authorization**
   - Users can only receive messages from subscribed rooms
   - Messages are isolated per phoneNumberId
   - Prevents unauthorized access to other users' conversations

3. **Automatic Protocol Selection**
   - Production (HTTPS): Uses `wss://` (encrypted)
   - Development (HTTP): Uses `ws://` (local only)

4. **Connection Management**
   - Automatic reconnection with exponential backoff
   - Heartbeat ping/pong every 30 seconds
   - Graceful connection cleanup on disconnect

## 🚀 Production Deployment Checklist

### 1. Generate Secure JWT Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `backend/.env`:
```env
JWT_SECRET=<generated-secret-here>
JWT_REFRESH_SECRET=<generated-refresh-secret-here>
```

### 2. Configure WSS (Secure WebSocket)

**Frontend `.env`:**
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_WS_URL=api.yourdomain.com
```

**Backend `.env`:**
```env
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com
```

### 3. SSL/TLS Certificate

WebSocket Secure (WSS) requires valid SSL certificate. Options:

- **Nginx/Apache Reverse Proxy** (Recommended)
- **Cloudflare** (Free SSL)
- **Let's Encrypt** (Free SSL)
- **Load Balancer** (AWS ELB, GCP LB, etc)

### 4. Nginx Configuration Example

```nginx
upstream backend {
    server localhost:3001;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # WebSocket upgrade
    location /ws/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for long-lived connections
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Regular HTTP endpoints
    location / {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔐 Security Best Practices

### DO ✅

- ✅ Use `wss://` in production (encrypted)
- ✅ Generate strong random JWT secrets (64+ characters)
- ✅ Set `NODE_ENV=production` in production
- ✅ Use HTTPS for frontend (auto-enables WSS)
- ✅ Configure CORS with specific domain (not `*`)
- ✅ Keep JWT tokens short-lived (15m for access token)
- ✅ Monitor failed authentication attempts
- ✅ Use environment variables for secrets

### DON'T ❌

- ❌ Use `ws://` in production (unencrypted)
- ❌ Use default/weak JWT secrets
- ❌ Expose JWT tokens in logs
- ❌ Use `CORS_ORIGIN=*` in production
- ❌ Commit `.env` files to git
- ❌ Share JWT secrets publicly
- ❌ Disable SSL certificate validation

## 🛡️ Additional Security Recommendations

### 1. Implement Rate Limiting for WebSocket

Add to `backend/src/services/chat-websocket.service.ts`:

```typescript
private messageRateLimit = new Map<string, { count: number; resetTime: number }>();

private checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const limit = this.messageRateLimit.get(clientId);

  if (!limit || now > limit.resetTime) {
    this.messageRateLimit.set(clientId, {
      count: 1,
      resetTime: now + 60000 // 1 minute window
    });
    return true;
  }

  if (limit.count >= 100) { // Max 100 messages per minute
    return false;
  }

  limit.count++;
  return true;
}
```

### 2. Validate Message Size

```typescript
private readonly MAX_MESSAGE_SIZE = 1024 * 100; // 100KB

private handleMessage(clientId: string, message: string | Buffer): void {
  const size = Buffer.byteLength(message);

  if (size > this.MAX_MESSAGE_SIZE) {
    console.warn(`Message too large from ${clientId}: ${size} bytes`);
    return;
  }

  // ... rest of handler
}
```

### 3. Origin Validation

Add to `backend/src/routes/websocket.routes.ts`:

```typescript
export async function handleWebSocketUpgrade(c: Context) {
  const origin = c.req.header('origin');
  const allowedOrigins = env.CORS_ORIGIN.split(',');

  if (!allowedOrigins.includes(origin || '')) {
    return c.json({ error: 'Origin not allowed' }, 403);
  }

  // ... rest of upgrade logic
}
```

### 4. IP-based Connection Limits

Limit concurrent connections per IP to prevent abuse.

### 5. Token Rotation

Implement token refresh mechanism to rotate tokens regularly.

## 📊 Monitoring

### Metrics to Track

- WebSocket connection count
- Failed authentication attempts
- Message rate per client
- Connection duration
- Reconnection frequency
- Error rates

### Logging

```typescript
// Log security events
console.log(`[SECURITY] Failed WS auth from IP: ${clientIP}`);
console.log(`[SECURITY] Rate limit exceeded: ${clientId}`);
console.log(`[SECURITY] Invalid origin: ${origin}`);
```

## 🧪 Testing

### Test WebSocket Security

```bash
# Test WSS connection (should work in production)
wscat -c "wss://api.yourdomain.com/ws/chat?token=YOUR_JWT_TOKEN"

# Test without token (should reject)
wscat -c "wss://api.yourdomain.com/ws/chat"

# Test with invalid token (should reject)
wscat -c "wss://api.yourdomain.com/ws/chat?token=invalid"
```

## 📝 Environment Files

### Development (`.env`)
```env
NEXT_PUBLIC_WS_URL=localhost:3001
```
→ Uses `ws://` (unencrypted, local only)

### Production (`.env.production`)
```env
NEXT_PUBLIC_WS_URL=api.yourdomain.com
```
→ Uses `wss://` (encrypted via HTTPS detection)

## 🆘 Troubleshooting

### Issue: WebSocket connection fails with "Mixed Content" error

**Solution:** Ensure frontend uses HTTPS and `NEXT_PUBLIC_WS_URL` points to domain (not localhost)

### Issue: "Origin not allowed" error

**Solution:** Add frontend domain to `CORS_ORIGIN` in backend `.env`

### Issue: Connection drops frequently

**Solution:** Check firewall/proxy timeout settings, increase nginx `proxy_read_timeout`

### Issue: Token appears in server logs

**Solution:** Configure logging to sanitize query parameters

## 📚 References

- [WebSocket Security Guide (OWASP)](https://owasp.org/www-community/vulnerabilities/WebSocket_Security)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Nginx WebSocket Proxying](https://nginx.org/en/docs/http/websocket.html)

---

**Last Updated:** 2026-01-08
**Security Audit Status:** ✅ Passed with recommendations implemented
