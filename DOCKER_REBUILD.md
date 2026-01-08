# 🐳 Docker Rebuild Guide

## 🔄 Rebuild Docker Containers

### Quick Rebuild (Recommended)

Rebuild dan restart semua containers dengan perubahan terbaru:

```bash
# Stop semua containers
docker compose down

# Rebuild images (dengan --no-cache untuk force rebuild)
docker compose build --no-cache

# Start containers
docker compose up -d

# Lihat logs
docker compose logs -f
```

### One-Line Command

```bash
docker compose down && docker compose build --no-cache && docker compose up -d
```

### Rebuild Hanya Frontend

```bash
# Rebuild hanya frontend service
docker compose build --no-cache omnichat-ui
docker compose up -d omnichat-ui

# Lihat logs frontend
docker compose logs -f omnichat-ui
```

### Rebuild Hanya Backend

```bash
# Rebuild hanya backend service
docker compose build --no-cache omnichat-api
docker compose up -d omnichat-api

# Lihat logs backend
docker compose logs -f omnichat-api
```

## 📝 Useful Docker Commands

### Check Status

```bash
# Lihat containers yang running
docker compose ps

# Lihat logs semua services
docker compose logs -f

# Lihat logs service tertentu
docker compose logs -f omnichat-ui
docker compose logs -f omnichat-api
```

### Stop & Remove

```bash
# Stop containers (tidak hapus data)
docker compose stop

# Stop dan hapus containers
docker compose down

# Stop, hapus containers + volumes + networks
docker compose down -v

# Hapus images juga
docker compose down --rmi all
```

### Clean Rebuild (Fresh Start)

Hapus semua cache dan rebuild dari awal:

```bash
# Stop dan hapus semua
docker compose down -v --rmi all

# Hapus build cache Docker
docker builder prune -a -f

# Rebuild dari 0
docker compose build --no-cache

# Start
docker compose up -d
```

## 🔍 Troubleshooting

### Issue: Perubahan .env tidak ter-apply

**Problem:** Environment variables masih pakai nilai lama

**Solution:**
```bash
# Rebuild dengan --no-cache
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Issue: Port sudah digunakan

**Problem:** `Error: port 3000/3001 already in use`

**Solution:**
```bash
# Check apa yang pakai port
lsof -i :3000
lsof -i :3001

# Kill process atau stop dev server dulu
# Lalu start Docker
docker compose up -d
```

### Issue: Image tidak terupdate

**Problem:** Code baru tidak masuk ke container

**Solution:**
```bash
# Force rebuild tanpa cache
docker compose build --pull --no-cache
docker compose up -d --force-recreate
```

### Issue: Database connection error

**Problem:** Backend tidak bisa connect ke database

**Solution:**
```bash
# Check backend .env
cat backend/.env | grep DB_

# Pastikan DB_HOST pakai host.docker.internal
# Restart container
docker compose restart omnichat-api
```

## 🎯 Current Setup

Berdasarkan `docker-compose.yml`:

- **Frontend (omnichat-ui)**: Port 3000
  - Container: `omnichat-ui`
  - Build context: `/Users/kurnia/Sites/chat-ui`
  - Env file: `.env`

- **Backend (omnichat-api)**: Port 3001
  - Container: `omnichat-api`
  - Build context: `/Users/kurnia/Sites/chat-ui/backend`
  - Env file: `backend/.env`

## 📊 Monitoring

### Real-time Logs

```bash
# Semua services
docker compose logs -f

# Hanya errors
docker compose logs -f | grep -i error

# Dengan timestamps
docker compose logs -f --timestamps
```

### Container Stats

```bash
# CPU & Memory usage
docker stats omnichat-ui omnichat-api
```

### Inspect Container

```bash
# Masuk ke container
docker exec -it omnichat-ui sh
docker exec -it omnichat-api sh

# Check environment variables
docker exec omnichat-ui env | grep NEXT_PUBLIC
docker exec omnichat-api env | grep API_PREFIX
```

## 🚀 Quick Reference

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start containers (background) |
| `docker compose down` | Stop & remove containers |
| `docker compose build` | Rebuild images |
| `docker compose build --no-cache` | Force rebuild tanpa cache |
| `docker compose restart` | Restart containers |
| `docker compose logs -f` | View logs (follow mode) |
| `docker compose ps` | List running containers |
| `docker compose exec <service> sh` | Enter container shell |

## 🔐 After Rebuilding

Setelah rebuild, verify:

1. **Check containers running:**
   ```bash
   docker compose ps
   ```

2. **Check logs for errors:**
   ```bash
   docker compose logs -f | grep -i error
   ```

3. **Test API endpoint:**
   ```bash
   curl http://localhost:3001/api/v1/auth/me
   ```

4. **Test frontend:**
   ```bash
   curl http://localhost:3000
   ```

5. **Check environment variables:**
   ```bash
   docker exec omnichat-ui env | grep NEXT_PUBLIC_API
   ```

---

**Last Updated:** 2026-01-08
