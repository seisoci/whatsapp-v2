# Middlewares Documentation

Dokumentasi lengkap untuk semua middleware yang digunakan dalam aplikasi.

## Struktur Middleware

```
middlewares/
├── index.ts                      # Central export point
├── auth.middleware.ts            # JWT authentication
├── rateLimiter.middleware.ts     # Rate limiting
├── securityHeaders.middleware.ts # HTTP security headers
├── cors.middleware.ts            # CORS configuration
├── sanitize.middleware.ts        # Input sanitization
└── ipFilter.middleware.ts        # IP filtering
```

## 1. Authentication Middleware

**File:** `auth.middleware.ts`

### Deskripsi
Middleware untuk memverifikasi JWT access token dan melindungi endpoint yang memerlukan autentikasi.

### Usage
```typescript
import { authMiddleware } from './middlewares';

router.get('/protected', authMiddleware, controller.method);
```

### Fitur
- Verifikasi JWT token dari Authorization header
- Validasi format Bearer token
- Check user existence dan status aktif
- Set user info ke context untuk digunakan di controller
- **Algorithm specification (HS256)** - Mencegah algorithm confusion attacks

### JWT Security
Token verification menggunakan explicit algorithm specification:
```typescript
jwt.verify(token, secret, {
  algorithms: ['HS256'],  // Whitelist only HS256
  issuer: 'auth-api',
  audience: 'auth-api-users'
});
```

**Mengapa penting:**
- ✅ Mencegah "Algorithm Confusion Attack"
- ✅ Attacker tidak bisa mengubah algorithm (e.g., RS256 → HS256)
- ✅ Explicit lebih aman daripada default behavior

### Response Errors
- `401`: Token tidak ada, invalid, atau expired
- `403`: User tidak aktif

---

## 2. Rate Limiter Middleware

**File:** `rateLimiter.middleware.ts`

### Deskripsi
Middleware untuk membatasi jumlah request dari IP address tertentu dalam window waktu tertentu.

### Usage
```typescript
import { rateLimiter } from './middlewares';

// Global rate limit: 100 requests per 15 menit
app.use('*', rateLimiter(15 * 60 * 1000, 100));

// Auth endpoints: 5 requests per 15 menit
const authRateLimiter = rateLimiter(15 * 60 * 1000, 5);
router.post('/login', authRateLimiter, controller.login);
```

### Parameters
- `windowMs` (number): Durasi window dalam milliseconds (default: 15 menit)
- `max` (number): Maximum requests per window (default: 100)

### Fitur
- IP-based rate limiting
- Automatic cleanup expired entries
- Configurable window dan limit
- Background cleanup setiap 5 menit

### Response Error
- `429`: Rate limit exceeded

---

## 3. Security Headers Middleware

**File:** `securityHeaders.middleware.ts`

### Deskripsi
Middleware untuk menambahkan HTTP security headers yang melindungi dari berbagai serangan.

### Usage
```typescript
import { securityHeaders } from './middlewares';

app.use('*', securityHeaders);
```

### Headers Yang Ditambahkan

| Header | Value | Purpose |
|--------|-------|---------|
| X-Content-Type-Options | nosniff | Mencegah MIME type sniffing |
| X-Frame-Options | DENY | Mencegah clickjacking |
| X-XSS-Protection | 1; mode=block | Enable XSS filter |
| Strict-Transport-Security | max-age=31536000 | Force HTTPS |
| Referrer-Policy | strict-origin-when-cross-origin | Kontrol referrer info |
| Permissions-Policy | geolocation=(), camera=() | Disable browser features |
| Content-Security-Policy | default-src 'self' | Prevent XSS/injection |
| Cache-Control | no-store | Prevent caching sensitive data |

### Proteksi Terhadap
- XSS (Cross-Site Scripting)
- Clickjacking
- MIME sniffing
- Code injection
- Information leakage

---

## 4. CORS Middleware

**File:** `cors.middleware.ts`

### Deskripsi
Middleware untuk mengontrol Cross-Origin Resource Sharing (CORS).

### Usage
```typescript
import { corsMiddleware } from './middlewares';

app.use('*', corsMiddleware);
```

### Konfigurasi
Allowed origins dikonfigurasi via environment variable `CORS_ORIGIN`:

```env
# Single origin
CORS_ORIGIN=http://localhost:3000

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:3000,https://example.com

# All origins (tidak disarankan untuk production)
CORS_ORIGIN=*
```

### Fitur
- Whitelist-based origin validation
- Support untuk credentials (cookies, auth headers)
- Preflight request handling
- Configurable allowed methods dan headers

### Headers
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Allow-Credentials`
- `Access-Control-Max-Age`
- `Access-Control-Expose-Headers`

---

## 5. Sanitize Middleware

**File:** `sanitize.middleware.ts`

### Deskripsi
Middleware untuk membersihkan input dari karakter berbahaya yang dapat menyebabkan XSS atau injection attacks.

### Usage
```typescript
import { sanitizeMiddleware, sanitizeInput } from './middlewares';

// Auto sanitization untuk POST/PUT/PATCH
app.use('*', sanitizeMiddleware);

// Manual sanitization
const clean = sanitizeInput(userInput);
```

### Fitur
- Hapus HTML tags (`<`, `>`)
- Hapus javascript: protocol
- Hapus event handlers (onclick, onerror, dll)
- Hapus data URI schemes
- Hapus vbscript: protocol
- Prototype pollution protection
- Recursive sanitization untuk objects dan arrays

### Karakter/Pattern Yang Dihapus
- `<` dan `>`
- `javascript:`
- `vbscript:`
- `data:text/html`
- `on*=` (event handlers)
- `__proto__`, `constructor`, `prototype` (object keys)

### Accessing Sanitized Data
```typescript
// Di controller
const body = c.get('sanitizedBody') || await c.req.json();
```

---

## 6. IP Filter Middleware

**File:** `ipFilter.middleware.ts`

### Deskripsi
Middleware untuk memfilter request berdasarkan IP address (blacklist/whitelist).

### Usage
```typescript
import {
  ipFilter,
  addToBlacklist,
  addToWhitelist,
  getClientIP
} from './middlewares';

// Enable IP filtering
app.use('*', ipFilter);

// Add IP to blacklist
addToBlacklist('192.168.1.100');

// Add IP to whitelist
addToWhitelist('192.168.1.1');

// Get client IP
const ip = getClientIP(c);
```

### Modes

#### Blacklist Mode (default)
Block specific IP addresses:
```typescript
// Di ipFilter.middleware.ts
const blacklistedIPs = new Set<string>([
  '192.168.1.100',
  '10.0.0.50',
]);
```

#### Whitelist Mode
Only allow specific IP addresses:
```typescript
// Di ipFilter.middleware.ts
const WHITELIST_MODE = true;
const whitelistedIPs = new Set<string>([
  '192.168.1.1',
  '10.0.0.1',
]);
```

### Helper Functions

| Function | Description |
|----------|-------------|
| `getClientIP(c)` | Get client IP dari headers |
| `addToBlacklist(ip)` | Tambah IP ke blacklist |
| `removeFromBlacklist(ip)` | Hapus IP dari blacklist |
| `addToWhitelist(ip)` | Tambah IP ke whitelist |
| `removeFromWhitelist(ip)` | Hapus IP dari whitelist |
| `isBlacklisted(ip)` | Check if IP is blacklisted |
| `isWhitelisted(ip)` | Check if IP is whitelisted |

### IP Detection Priority
1. `X-Forwarded-For` header (proxy/load balancer)
2. `X-Real-IP` header
3. `CF-Connecting-IP` header (Cloudflare)

### Response Error
- `403`: Access denied (IP blocked atau not whitelisted)

---

## Middleware Order

Urutan middleware sangat penting! Gunakan urutan berikut untuk keamanan optimal:

```typescript
// 1. Logger (untuk monitoring)
app.use('*', logger());

// 2. Security Headers (set headers dulu)
app.use('*', securityHeaders);

// 3. CORS (handle preflight requests)
app.use('*', corsMiddleware);

// 4. IP Filter (block malicious IPs)
app.use('*', ipFilter);

// 5. Input Sanitization (clean input)
app.use('*', sanitizeMiddleware);

// 6. Rate Limiting (prevent abuse)
app.use('*', rateLimiter());

// 7. Routes
app.route('/api/v1/auth', authRouter);
```

## Testing Middleware

### Test Rate Limiter
```bash
# Send multiple requests
for i in {1..10}; do
  curl http://localhost:3001/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
done
```

### Test CORS
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Origin: http://localhost:3000" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v
```

### Test Security Headers
```bash
curl http://localhost:3001/health -I
```

### Test Input Sanitization
```bash
curl http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@test.com",
    "username":"<script>alert(1)</script>",
    "password":"Test@123"
  }'
```

## Best Practices

1. **Always use multiple layers of security** - Defense in depth
2. **Set appropriate rate limits** - Balance security vs user experience
3. **Whitelist CORS origins** - Never use `*` in production
4. **Sanitize all user input** - Don't trust client data
5. **Monitor and log** - Track suspicious activities
6. **Keep middleware updated** - Regular security updates
7. **Test in staging** - Before deploying to production

## Performance Considerations

- Rate limiter menggunakan in-memory Map (untuk production, gunakan Redis)
- Auto cleanup untuk mencegah memory leaks
- Middleware order affects performance
- Cache preflight CORS requests (24 jam)

## Production Checklist

- [ ] Set strong CORS origins (no wildcard)
- [ ] Configure appropriate rate limits
- [ ] Enable HTTPS (HSTS)
- [ ] Review and update IP blacklist
- [ ] Monitor middleware performance
- [ ] Set up logging and alerting
- [ ] Test all security headers
- [ ] Regular security audits
