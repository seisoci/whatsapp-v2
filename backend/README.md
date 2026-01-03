# Backend Authentication API

Backend API dengan keamanan tinggi menggunakan Bun, Hono Framework, TypeORM, PostgreSQL, dan JWT Authentication.

## Fitur Keamanan

### 1. **Authentication & Authorization**
- JWT (JSON Web Token) untuk access token dengan expiry pendek (15 menit)
- Refresh token dengan expiry lebih panjang (7 hari) yang disimpan di database
- Token rotation untuk mencegah token reuse
- Middleware authentication untuk melindungi endpoint

### 2. **Password Security**
- Bcrypt hashing dengan 12 rounds (konfigurabel)
- Password policy yang kuat:
  - Minimum 8 karakter
  - Harus mengandung huruf besar, kecil, angka, dan simbol
- Password tidak pernah dikirim dalam response

### 3. **Account Protection**
- Login attempt limiting (5 percobaan)
- Account locking setelah failed attempts (15 menit)
- Automatic unlock setelah lockout period
- Last login tracking (IP dan timestamp)

### 4. **Input Validation & Sanitization**
- Zod schema validation untuk semua input
- Input sanitization untuk mencegah XSS
- SQL injection protection via TypeORM parameterized queries
- Email dan username normalization

### 5. **Rate Limiting**
- Global rate limiting (100 requests per 15 menit)
- Auth endpoint rate limiting (5 requests per 15 menit untuk login/register)
- IP-based tracking
- Automatic cleanup expired entries

### 6. **Security Headers**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection
- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- Referrer-Policy
- Permissions-Policy

### 7. **CORS Protection**
- Whitelist-based CORS
- Credentials support
- Pre-flight request handling

### 8. **Database Security**
- Connection pooling dengan limits
- Prepared statements via TypeORM
- Cascade delete untuk referential integrity
- Indexes untuk performa query

### 9. **Session Management**
- Refresh token dengan metadata (IP, User Agent)
- Token revocation support
- Expired token cleanup capability

### 10. **Additional Security**
- IP blacklisting capability
- Comprehensive error handling tanpa leak informasi sensitif
- Structured logging
- Environment variable validation

## Instalasi

### Prerequisites
- [Bun](https://bun.sh) >= 1.0.0
- PostgreSQL >= 14

### Setup

1. Clone repository dan masuk ke folder backend:
```bash
cd backend
```

2. Install dependencies:
```bash
bun install
```

3. Copy file environment:
```bash
cp .env.example .env
```

4. Konfigurasi file `.env` dengan kredensial database dan secrets Anda:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=auth_db

# JWT Secrets (GANTI dengan secrets yang kuat!)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-chars
```

5. Buat database PostgreSQL:
```bash
createdb auth_db
```

Atau via psql:
```sql
CREATE DATABASE auth_db;
```

6. Jalankan migrations:
```bash
bun run migration:run
```

7. Start development server:
```bash
bun run dev
```

Server akan berjalan di `http://localhost:3001`

## API Endpoints

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication Endpoints

#### 1. Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "SecureP@ss123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registrasi berhasil.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### 2. Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login berhasil.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "username",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### 3. Refresh Token
```http
POST /api/v1/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token berhasil diperbarui.",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 4. Logout
```http
POST /api/v1/auth/logout
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout berhasil."
}
```

#### 5. Get Current User (Protected)
```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "isActive": true,
    "emailVerified": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validasi gagal.",
  "errors": [
    {
      "path": ["password"],
      "message": "Password harus minimal 8 karakter"
    }
  ]
}
```

### Unauthorized (401)
```json
{
  "success": false,
  "message": "Token tidak valid atau sudah kadaluarsa."
}
```

### Account Locked (423)
```json
{
  "success": false,
  "message": "Akun terkunci. Silakan coba lagi dalam 15 menit."
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "message": "Terlalu banyak permintaan. Silakan coba lagi nanti."
}
```

## Development

### Run in Development Mode
```bash
bun run dev
```

### Run in Production Mode
```bash
bun run start
```

### Database Migrations

Generate migration:
```bash
bun run migration:generate -- src/migrations/MigrationName
```

Run migrations:
```bash
bun run migration:run
```

Revert migration:
```bash
bun run migration:revert
```

## Security Checklist

- [x] Password hashing dengan bcrypt
- [x] JWT dengan expiry time
- [x] Refresh token rotation
- [x] Rate limiting
- [x] Input validation dan sanitization
- [x] SQL injection protection
- [x] XSS protection
- [x] CORS configuration
- [x] Security headers
- [x] Account locking
- [x] Login attempt tracking
- [x] IP tracking
- [x] Token revocation
- [x] Environment variable validation
- [x] Error handling tanpa information leakage

## Production Deployment

### Environment Variables
Pastikan untuk mengubah semua secrets di production:

```env
NODE_ENV=production
JWT_SECRET=<generate-strong-secret-min-32-chars>
JWT_REFRESH_SECRET=<generate-strong-secret-min-32-chars>
DB_PASSWORD=<strong-database-password>
```

### Generate Secure Secrets
```bash
# Generate JWT secret
openssl rand -base64 32

# Atau menggunakan Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Database
- Gunakan connection pooling
- Enable SSL untuk production
- Regular backups
- Monitor query performance

### Server
- Deploy behind reverse proxy (nginx)
- Enable HTTPS
- Configure firewall
- Monitor logs
- Set up health checks

## Struktur Project

```
backend/
├── src/
│   ├── config/                       # Konfigurasi database dan environment
│   │   ├── database.ts
│   │   └── env.ts
│   ├── controllers/                  # Request handlers
│   │   └── auth.controller.ts
│   ├── middlewares/                  # Security & auth middlewares
│   │   ├── index.ts                  # Central export
│   │   ├── auth.middleware.ts        # JWT authentication
│   │   ├── rateLimiter.middleware.ts # Rate limiting
│   │   ├── securityHeaders.middleware.ts # HTTP security headers
│   │   ├── cors.middleware.ts        # CORS configuration
│   │   ├── sanitize.middleware.ts    # Input sanitization
│   │   ├── ipFilter.middleware.ts    # IP filtering
│   │   └── README.md                 # Middleware documentation
│   ├── migrations/                   # Database migrations
│   │   ├── 1704000000000-CreateUserTable.ts
│   │   └── 1704000000001-CreateRefreshTokenTable.ts
│   ├── models/                       # TypeORM entities
│   │   ├── User.ts
│   │   └── RefreshToken.ts
│   ├── routes/                       # API routes
│   │   └── auth.routes.ts
│   ├── types/                        # TypeScript types
│   │   └── index.ts
│   ├── utils/                        # Helper functions
│   │   ├── jwt.ts
│   │   └── validators.ts
│   └── index.ts                      # Entry point
├── .env                              # Environment variables (gitignored)
├── .env.example                      # Example environment variables
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

### Middleware Documentation

Untuk dokumentasi lengkap tentang setiap middleware, lihat [src/middlewares/README.md](src/middlewares/README.md)

## Testing

Gunakan tool seperti Postman, Insomnia, atau curl untuk testing API.

### Example dengan curl:

```bash
# Register
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"SecureP@ss123"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecureP@ss123"}'

# Get current user
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## License

MIT
