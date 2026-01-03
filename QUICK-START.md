# Quick Start - PM2 Production Deployment

## 🚀 Quick Deploy (3 Steps)

### Step 1: Fix Environment
```bash
./setup-env.sh
```

### Step 2: Deploy to Production
```bash
./pm2.sh
```

### Step 3: Verify
```bash
pm2 logs isomorphic-nextjs
```

---

## 📋 Common Commands

### Deployment
```bash
# First time deployment
./setup-env.sh    # Fix environment variables
./pm2.sh          # Deploy with PM2

# Update deployment (after git pull)
./pm2.sh          # Zero-downtime reload
```

### Monitoring
```bash
pm2 logs isomorphic-nextjs         # View logs (live)
pm2 logs isomorphic-nextjs --lines 100  # Last 100 lines
pm2 monit                          # Real-time dashboard
pm2 status                         # View all processes
```

### Control
```bash
pm2 reload isomorphic-nextjs       # Zero-downtime reload (recommended)
pm2 restart isomorphic-nextjs      # Restart (brief downtime)
pm2 stop isomorphic-nextjs         # Stop application
pm2 start isomorphic-nextjs        # Start application
pm2 delete isomorphic-nextjs       # Remove from PM2
```

### Scaling
```bash
pm2 scale isomorphic-nextjs 4      # Scale to 4 instances
pm2 scale isomorphic-nextjs max    # Use all CPU cores
```

---

## ⚙️ Configuration

### Port Configuration
```bash
# Default port 3000
./pm2.sh

# Custom port
PORT=3001 ./pm2.sh
```

### Instance Configuration
```bash
# Auto (use all CPU cores)
./pm2.sh

# Specific number
PM2_INSTANCES=4 ./pm2.sh

# Single instance
PM2_INSTANCES=1 ./pm2.sh
```

### Combined
```bash
PORT=3001 PM2_INSTANCES=4 ./pm2.sh
```

---

## 🔧 Troubleshooting

### Build Errors
```bash
# Test build manually
pnpm run build

# Check for TypeScript errors
pnpm run lint
```

### Environment Variable Errors
```bash
# Re-run setup
./setup-env.sh

# Manually check .env.local
cat .env.local | grep NEXTAUTH

# Verify required variables
grep "NEXTAUTH_SECRET\|NEXTAUTH_URL" .env.local
```

### Application Not Starting
```bash
# Check PM2 logs
pm2 logs isomorphic-nextjs --err

# Check if port is in use
lsof -i :3000

# Delete and restart
pm2 delete isomorphic-nextjs
./pm2.sh
```

### High Memory Usage
```bash
# Reduce instances
pm2 scale isomorphic-nextjs 2

# Check memory usage
pm2 list
```

---

## 📁 File Structure

```
.
├── pm2.sh              # Main deployment script
├── setup-env.sh        # Environment setup helper
├── ecosystem.config.js # PM2 config (auto-generated)
├── .env.local          # Environment variables (not in git)
├── logs/               # PM2 logs directory
│   ├── pm2-error.log
│   ├── pm2-out.log
│   └── pm2-combined.log
└── DEPLOYMENT.md       # Full documentation
```

---

## 🎯 Production Checklist

Before deploying to production:

- [ ] Run `./setup-env.sh` to fix environment
- [ ] Update `NEXTAUTH_URL` to production domain
- [ ] Update `NEXT_PUBLIC_API_URL` if needed
- [ ] Test build: `pnpm run build`
- [ ] Configure firewall for port 3000 (or custom port)
- [ ] Setup nginx reverse proxy (optional)
- [ ] Setup SSL certificate (recommended)
- [ ] Run `./pm2.sh` to deploy
- [ ] Run `pm2 save` after deployment
- [ ] Run `pm2 startup` for auto-start on reboot

---

## 🌐 Nginx Reverse Proxy (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📚 Full Documentation

For complete documentation, see [DEPLOYMENT.md](DEPLOYMENT.md)

---

## ⚡ Performance Tips

1. **Use cluster mode** (default) for better performance
2. **Set instances to CPU cores**: `PM2_INSTANCES=4`
3. **Monitor memory**: Keep under 1GB per instance
4. **Use reload** instead of restart for zero-downtime
5. **Enable nginx caching** for static assets
6. **Use CDN** for production

---

## 🆘 Support

### Check Logs
```bash
# All logs
pm2 logs isomorphic-nextjs

# Only errors
pm2 logs isomorphic-nextjs --err

# Only output
pm2 logs isomorphic-nextjs --out

# Clear logs
pm2 flush
```

### Get Help
```bash
pm2 --help
pm2 logs --help
pm2 scale --help
```

### Useful Resources
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- Project: [DEPLOYMENT.md](DEPLOYMENT.md)
