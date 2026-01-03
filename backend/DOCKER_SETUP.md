# Docker Setup Guide

Panduan untuk menjalankan semua services (PostgreSQL, Redis, MinIO) menggunakan Docker.

## 🐳 Quick Start

### 1. Install Docker

Pastikan Docker dan Docker Compose sudah terinstall:
```bash
docker --version
docker-compose --version
```

Download Docker Desktop: https://www.docker.com/products/docker-desktop

---

### 2. Start All Services

```bash
cd backend

# Start PostgreSQL, Redis, and MinIO
docker-compose up -d

# Check status
docker-compose ps
```

**Expected output:**
```
NAME                   STATUS          PORTS
auth-api-postgres      Up              0.0.0.0:5432->5432/tcp
auth-api-redis         Up              0.0.0.0:6379->6379/tcp
auth-api-minio         Up              0.0.0.0:9000-9001->9000-9001/tcp
```

---

### 3. Verify Services

#### PostgreSQL
```bash
# Connect to PostgreSQL
docker exec -it auth-api-postgres psql -U postgres -d auth_db

# Or using local psql
psql -h localhost -p 5432 -U postgres -d auth_db
# Password: postgres
```

#### Redis
```bash
# Connect to Redis
docker exec -it auth-api-redis redis-cli

# Test
127.0.0.1:6379> PING
PONG
```

#### MinIO
```bash
# Access MinIO Console
open http://localhost:9001

# Login credentials:
# Username: minioadmin
# Password: minioadmin
```

---

### 4. Start Backend Server

```bash
# Install dependencies (if not done)
bun install

# Run migrations
bun run migration:run

# Start server
bun run dev
```

---

## 📋 Docker Commands

### Start Services
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d postgres
docker-compose up -d redis
docker-compose up -d minio

# View logs
docker-compose logs -f
docker-compose logs -f redis
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes data)
docker-compose down -v
```

### Restart Services
```bash
# Restart all
docker-compose restart

# Restart specific
docker-compose restart redis
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f minio

# Last 100 lines
docker-compose logs --tail=100 redis
```

---

## 🛠️ Service Configuration

### PostgreSQL Configuration

**Default Settings:**
- Host: localhost
- Port: 5432
- Username: postgres
- Password: postgres
- Database: auth_db

**Data Volume:** `postgres_data`

**Backup Database:**
```bash
docker exec auth-api-postgres pg_dump -U postgres auth_db > backup.sql
```

**Restore Database:**
```bash
docker exec -i auth-api-postgres psql -U postgres auth_db < backup.sql
```

---

### Redis Configuration

**Default Settings:**
- Host: localhost
- Port: 6379
- Password: (empty)
- Database: 0

**Data Volume:** `redis_data`

**Clear All Data:**
```bash
docker exec auth-api-redis redis-cli FLUSHALL
```

**Monitor Redis:**
```bash
docker exec -it auth-api-redis redis-cli MONITOR
```

---

### MinIO Configuration

**Default Settings:**
- API Endpoint: http://localhost:9000
- Console: http://localhost:9001
- Access Key: minioadmin
- Secret Key: minioadmin
- Bucket: uploads (auto-created)

**Data Volume:** `minio_data`

**Access Console:**
```bash
open http://localhost:9001
```

---

## 🔧 Optional Tools

### Redis Commander (Web UI for Redis)

Start with tools profile:
```bash
docker-compose --profile tools up -d redis-commander
```

Access: http://localhost:8081

---

## 🎯 Production Setup

### Update docker-compose.yml for Production

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}  # Use env variable
    restart: unless-stopped

  redis:
    command: redis-server --requirepass ${REDIS_PASSWORD}
    restart: unless-stopped

  minio:
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    restart: unless-stopped
```

### Use .env file

Create `.env` file:
```env
DB_PASSWORD=strong-postgres-password
REDIS_PASSWORD=strong-redis-password
MINIO_ACCESS_KEY=your-minio-access-key
MINIO_SECRET_KEY=your-minio-secret-key-min-32-chars
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Check what's using port
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis
lsof -i :9000  # MinIO

# Kill process or change port in docker-compose.yml
```

### Container Won't Start

```bash
# View logs
docker-compose logs postgres

# Remove and recreate
docker-compose down
docker-compose up -d
```

### Permission Issues

```bash
# Fix volume permissions
docker-compose down -v
docker volume prune
docker-compose up -d
```

### Clean Slate (Remove Everything)

```bash
# ⚠️ This will delete all data!
docker-compose down -v
docker system prune -a
docker volume prune
```

---

## 📊 Health Checks

### Check All Services

```bash
# PostgreSQL
docker exec auth-api-postgres pg_isready -U postgres

# Redis
docker exec auth-api-redis redis-cli ping

# MinIO
curl http://localhost:9000/minio/health/live
```

---

## 🚀 Complete Setup Script

Create `setup.sh`:

```bash
#!/bin/bash

echo "🐳 Starting Docker services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."
sleep 10

echo "✅ Checking services..."
docker-compose ps

echo "🗄️  Running database migrations..."
bun run migration:run

echo "🎉 Setup complete!"
echo ""
echo "Services running:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - MinIO Console: http://localhost:9001"
echo ""
echo "Start backend: bun run dev"
```

Make executable and run:
```bash
chmod +x setup.sh
./setup.sh
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- [Redis Docker Hub](https://hub.docker.com/_/redis)
- [MinIO Docker Hub](https://hub.docker.com/r/minio/minio)

---

**Updated:** 2024-01-02
**Version:** 1.0.0
