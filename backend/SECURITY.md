# Security Best Practices

Dokumentasi tentang implementasi keamanan dalam aplikasi.

## 🔐 JWT Security

### Algorithm Specification

**Mengapa penting:**
- ✅ Mencegah "Algorithm Confusion Attack"
- ✅ Mencegah attacker mengubah algorithm dari RS256 ke HS256
- ✅ Explicit specification lebih aman daripada default

**Implementasi:**
```typescript
// ✅ BENAR - Dengan explicit algorithm
jwt.sign(payload, secret, {
  algorithm: 'HS256',  // Explicit saat sign
  expiresIn: '15m'
});

jwt.verify(token, secret, {
  algorithms: ['HS256'],  // Whitelist algorithms saat verify
  issuer: 'auth-api',
  audience: 'auth-api-users'
});

// ❌ SALAH - Tanpa algorithm specification
jwt.verify(token, secret);  // Vulnerable to algorithm confusion
```

### Token Best Practices

1. **Short-lived Access Tokens**
   - Access token: 15 menit
   - Reduce impact jika token dicuri

2. **Long-lived Refresh Tokens**
   - Refresh token: 7 hari
   - Stored di database dengan revocation capability

3. **Token Claims**
   - `iss` (issuer): Identify token issuer
   - `aud` (audience): Validate intended recipient
   - `exp` (expiry): Auto expiration
   - `iat` (issued at): Track token age

4. **Secret Management**
   - Minimum 32 characters
   - Different secrets untuk access & refresh tokens
   - Store di environment variables
   - Never commit to version control

---

## 🛡️ Password Security

### Hashing Strategy

**Bcrypt Configuration:**
```typescript
// 12 rounds = 2^12 iterations
const BCRYPT_ROUNDS = 12;
```

**Mengapa Bcrypt:**
- ✅ Slow by design (resistant to brute force)
- ✅ Automatic salt generation
- ✅ Adaptive - dapat increase rounds di masa depan
- ✅ Industry standard

**Password Policy:**
```typescript
- Minimum 8 characters
- Must contain: uppercase, lowercase, number, symbol
- Validated dengan Zod schema
- No common passwords (dapat ditambahkan)
```

### Account Locking

**Protection terhadap Brute Force:**
```typescript
MAX_LOGIN_ATTEMPTS = 5
LOCK_TIME = 15 minutes
```

**Flow:**
1. Track failed login attempts
2. Lock account setelah 5 attempts
3. Auto unlock setelah 15 menit
4. Reset counter setelah successful login

---

## 🚫 Input Validation & Sanitization

### XSS Prevention

**Multiple Layers:**

1. **Input Sanitization** ([sanitize.middleware.ts](src/middlewares/sanitize.middleware.ts))
   ```typescript
   - Remove HTML tags: < >
   - Remove javascript: protocol
   - Remove event handlers: onclick, onerror
   - Remove data: URI schemes
   - Prototype pollution protection
   ```

2. **Content Security Policy** ([securityHeaders.middleware.ts](src/middlewares/securityHeaders.middleware.ts))
   ```
   script-src 'self'
   default-src 'self'
   ```

3. **Output Encoding**
   - JSON responses auto-escaped
   - TypeORM parameterized queries

### SQL Injection Prevention

**TypeORM Parameterized Queries:**
```typescript
// ✅ SAFE - TypeORM handles escaping
await userRepository.findOne({
  where: { email: userInput }
});

// ❌ DANGEROUS - Raw query tanpa parameter
await connection.query(
  `SELECT * FROM users WHERE email = '${userInput}'`
);
```

---

## 🔒 HTTP Security Headers

Implemented di [securityHeaders.middleware.ts](src/middlewares/securityHeaders.middleware.ts)

### Headers Implemented:

| Header | Value | Protection Against |
|--------|-------|-------------------|
| **X-Content-Type-Options** | nosniff | MIME sniffing attacks |
| **X-Frame-Options** | DENY | Clickjacking |
| **X-XSS-Protection** | 1; mode=block | Legacy XSS |
| **Strict-Transport-Security** | max-age=31536000 | Man-in-the-middle |
| **Content-Security-Policy** | restrictive | XSS, injection |
| **Referrer-Policy** | strict-origin-when-cross-origin | Information leakage |
| **Permissions-Policy** | restricted | Unwanted features |

---

## 🚦 Rate Limiting

Implemented di [rateLimiter.middleware.ts](src/middlewares/rateLimiter.middleware.ts)

### Strategy:

**Global Rate Limit:**
- 100 requests per 15 menit
- Applies to all endpoints

**Auth Endpoints:**
- 5 requests per 15 menit
- Stricter untuk login/register
- Prevent brute force attacks

**IP-based Tracking:**
- Uses X-Forwarded-For header
- Handles proxy/load balancer scenarios
- Auto cleanup untuk memory management

### Production Recommendations:

```typescript
// Development (current)
- In-memory Map
- Simple implementation

// Production
- Use Redis untuk distributed rate limiting
- Persistent storage
- Scale across multiple servers
```

---

## 🌐 CORS Configuration

Implemented di [cors.middleware.ts](src/middlewares/cors.middleware.ts)

### Security Considerations:

**Whitelist Origins:**
```env
# ✅ PRODUCTION
CORS_ORIGIN=https://yourapp.com,https://www.yourapp.com

# ⚠️ DEVELOPMENT ONLY
CORS_ORIGIN=http://localhost:3000

# ❌ NEVER IN PRODUCTION
CORS_ORIGIN=*
```

**Credentials:**
```typescript
Access-Control-Allow-Credentials: true
```
- Only with specific origins
- Never with wildcard (*)

---

## 🔍 IP Filtering

Implemented di [ipFilter.middleware.ts](src/middlewares/ipFilter.middleware.ts)

### Modes:

**1. Blacklist Mode (default)**
```typescript
// Block malicious IPs
const blacklistedIPs = new Set([
  '192.168.1.100',
  '10.0.0.50',
]);
```

**2. Whitelist Mode**
```typescript
// Only allow specific IPs (admin panel, etc)
const WHITELIST_MODE = true;
const whitelistedIPs = new Set([
  '192.168.1.1',
  '10.0.0.1',
]);
```

---

## 📊 Database Security

### Connection Security:

**Configuration:**
```typescript
// PostgreSQL connection
{
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  extra: {
    max: 20,                    // Connection pool limit
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}
```

**Best Practices:**
- ✅ Use connection pooling
- ✅ Enable SSL in production
- ✅ Minimum privilege principle
- ✅ Regular backups
- ✅ Monitor slow queries

### Migration Security:

**Version Control:**
- All migrations tracked
- Timestamp-based ordering
- Rollback capability
- Tested before deployment

---

## 🔑 Secrets Management

### Environment Variables:

**Required Secrets:**
```env
JWT_SECRET              # Min 32 chars, high entropy
JWT_REFRESH_SECRET      # Min 32 chars, different from JWT_SECRET
DB_PASSWORD             # Strong database password
```

**Generation:**
```bash
# OpenSSL
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Bun
bun -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Rotation:**
- Rotate secrets periodically (every 90 days)
- Use secret management service (AWS Secrets Manager, HashiCorp Vault)
- Never commit to git
- Different secrets per environment

---

## 📝 Logging & Monitoring

### Security Logging:

**Should Log:**
- ✅ Failed login attempts
- ✅ Account lockouts
- ✅ Password changes
- ✅ Token refresh events
- ✅ Rate limit violations
- ✅ IP filter blocks

**Should NOT Log:**
- ❌ Passwords (even hashed)
- ❌ Tokens
- ❌ Personal information (PII)
- ❌ Credit card numbers

### Monitoring:

```typescript
// Metrics to track
- Failed login rate
- Token refresh rate
- Rate limit hits
- Database query times
- Error rates
- Response times
```

---

## 🧪 Security Testing

### Testing Checklist:

**Authentication:**
- [ ] Test expired tokens
- [ ] Test invalid tokens
- [ ] Test missing tokens
- [ ] Test account lockout
- [ ] Test password requirements

**Authorization:**
- [ ] Test access to protected routes
- [ ] Test user isolation
- [ ] Test role-based access

**Input Validation:**
- [ ] Test XSS payloads
- [ ] Test SQL injection
- [ ] Test prototype pollution
- [ ] Test long inputs
- [ ] Test special characters

**Rate Limiting:**
- [ ] Test exceeding limits
- [ ] Test distributed requests
- [ ] Test reset timing

**Headers:**
- [ ] Verify all security headers
- [ ] Test CSP violations
- [ ] Test CORS restrictions

---

## 🚀 Production Deployment

### Pre-deployment Checklist:

**Secrets:**
- [ ] Generate new strong secrets
- [ ] Different secrets per environment
- [ ] Secrets in secure storage

**Configuration:**
- [ ] NODE_ENV=production
- [ ] Database SSL enabled
- [ ] CORS whitelist configured
- [ ] Rate limits appropriate
- [ ] Logging configured

**Infrastructure:**
- [ ] HTTPS enabled
- [ ] Firewall configured
- [ ] DDoS protection
- [ ] Load balancer setup
- [ ] Health checks enabled

**Database:**
- [ ] Migrations tested
- [ ] Backup strategy
- [ ] Connection pooling
- [ ] Monitoring enabled

**Monitoring:**
- [ ] Error tracking (Sentry)
- [ ] Performance monitoring (New Relic)
- [ ] Log aggregation (ELK, CloudWatch)
- [ ] Alerting configured

---

## 📚 Security Resources

### OWASP Top 10 (2021):
1. Broken Access Control ✅
2. Cryptographic Failures ✅
3. Injection ✅
4. Insecure Design ✅
5. Security Misconfiguration ✅
6. Vulnerable Components ⚠️ (keep updated)
7. Authentication Failures ✅
8. Data Integrity Failures ✅
9. Logging Failures ⚠️ (implement robust logging)
10. Server Side Request Forgery ✅

### References:
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [JWT Best Practices](https://datatracker.ietf.org/doc/html/rfc8725)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)

---

## 🔄 Regular Security Tasks

### Weekly:
- Review failed login attempts
- Check rate limit violations
- Monitor error rates

### Monthly:
- Review and update dependencies
- Audit logs for suspicious activity
- Review IP blacklist/whitelist
- Check token usage patterns

### Quarterly:
- Security audit
- Penetration testing
- Update documentation
- Rotate secrets

### Annually:
- Full security review
- Update security policies
- Team security training
- Third-party security audit

---

## 📞 Security Incident Response

### If Security Breach Detected:

1. **Immediate Actions:**
   - Revoke all active tokens
   - Lock affected accounts
   - Block malicious IPs
   - Enable maintenance mode if needed

2. **Investigation:**
   - Review logs
   - Identify attack vector
   - Assess data exposure
   - Document timeline

3. **Remediation:**
   - Fix vulnerability
   - Deploy patch
   - Force password resets
   - Notify affected users

4. **Post-Incident:**
   - Update security measures
   - Document lessons learned
   - Update incident response plan
   - Improve monitoring

---

**Last Updated:** 2024-01-02
**Version:** 1.0.0
**Maintained by:** Security Team
