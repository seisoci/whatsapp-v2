# PM2 Deployment Guide for Next.js (Isomorphic)

## Prerequisites

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Install pnpm (if not already installed):**
   ```bash
   npm install -g pnpm
   ```

3. **Node.js version:** Make sure you have Node.js 18+ installed

## Environment Setup

### Quick Setup (Recommended)

Run the environment setup helper to automatically fix common issues:

```bash
chmod +x setup-env.sh
./setup-env.sh
```

This will:
- Generate proper `NEXTAUTH_SECRET` if needed
- Add `NEXTAUTH_URL` if missing
- Validate your environment configuration

### Manual Setup

Create environment file for production:

```bash
# Option 1: Create .env.production
cp .env.local.example .env.production

# Option 2: Create .env.local (for testing production locally)
cp .env.local.example .env.local

# Option 3: Use existing .env
```

**Important:** Update the environment file with production values:

#### Required Variables:
```bash
# NextAuth Configuration (REQUIRED)
NEXTAUTH_SECRET=your-secret-here  # Generate with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000  # Update to your domain in production

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8001

# Other required configs...
```

**⚠️ Common Issues:**

1. **NEXTAUTH_SECRET with `$(openssl ...)`**
   - ❌ Wrong: `NEXTAUTH_SECRET=$(openssl rand -base64 32)`
   - ✅ Correct: Run `openssl rand -base64 32` first, then paste the result

2. **Missing NEXTAUTH_URL**
   - Must be set to your application URL
   - Local: `http://localhost:3000`
   - Production: `https://your-domain.com`

## Deployment

### First Time Deployment

1. **Make the deployment script executable:**
   ```bash
   chmod +x deploy-pm2.sh
   ```

2. **Run the deployment:**
   ```bash
   ./deploy-pm2.sh
   ```

   Or with custom settings:
   ```bash
   # Custom port
   PORT=3001 ./deploy-pm2.sh

   # Custom number of instances
   PM2_INSTANCES=4 ./deploy-pm2.sh

   # Both
   PORT=3001 PM2_INSTANCES=4 ./deploy-pm2.sh
   ```

3. **Setup PM2 startup (run once):**
   ```bash
   # This will show a command to run with sudo
   pm2 startup

   # Then run the command shown (example):
   sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u youruser --hp /home/youruser
   ```

4. **Save PM2 configuration:**
   ```bash
   pm2 save
   ```

### Update Deployment

When you have new code to deploy:

```bash
# Pull latest code
git pull

# Run deployment (will do zero-downtime reload)
./deploy-pm2.sh
```

## PM2 Commands

### Basic Commands

```bash
# View all processes
pm2 list
pm2 status

# View detailed info
pm2 info isomorphic-nextjs

# View logs (live tail)
pm2 logs isomorphic-nextjs

# View logs (last 100 lines)
pm2 logs isomorphic-nextjs --lines 100

# Clear logs
pm2 flush
```

### Control Commands

```bash
# Reload (zero-downtime, recommended for updates)
pm2 reload isomorphic-nextjs

# Restart (brief downtime)
pm2 restart isomorphic-nextjs

# Stop
pm2 stop isomorphic-nextjs

# Start
pm2 start isomorphic-nextjs

# Delete (stop and remove from PM2)
pm2 delete isomorphic-nextjs
```

### Scaling

```bash
# Scale to 4 instances
pm2 scale isomorphic-nextjs 4

# Scale to max (auto-detect CPU cores)
pm2 scale isomorphic-nextjs max
```

### Monitoring

```bash
# Real-time monitoring dashboard
pm2 monit

# Web-based monitoring (PM2 Plus)
pm2 plus
```

## Configuration

The deployment script automatically creates `ecosystem.config.js` with:

- **Cluster mode:** For optimal performance using all CPU cores
- **Auto-restart:** Automatically restarts on crashes
- **Memory limit:** Restarts if memory exceeds 1GB
- **Log management:** Centralized logging in `./logs/` directory
- **Environment variables:** Loaded from `.env.production`, `.env.local`, or `.env`

### Custom Configuration

You can modify `ecosystem.config.js` after it's generated:

```javascript
module.exports = {
  apps: [{
    name: 'isomorphic-nextjs',
    script: 'node_modules/.bin/next',
    args: 'start',
    instances: 4, // Change this
    exec_mode: 'cluster',
    max_memory_restart: '2G', // Change this
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      // Add more env vars here
    }
  }]
};
```

Then reload:
```bash
pm2 reload ecosystem.config.js --update-env
```

## Troubleshooting

### Application not starting

1. Check logs:
   ```bash
   pm2 logs isomorphic-nextjs --err
   ```

2. Check if port is already in use:
   ```bash
   lsof -i :3000
   ```

3. Try running Next.js manually:
   ```bash
   pnpm run build
   pnpm start
   ```

### High memory usage

1. Reduce number of instances:
   ```bash
   pm2 scale isomorphic-nextjs 2
   ```

2. Increase memory limit in `ecosystem.config.js`:
   ```javascript
   max_memory_restart: '2G'
   ```

### Port already in use

1. Change port:
   ```bash
   PORT=3001 ./deploy-pm2.sh
   ```

2. Or update `ecosystem.config.js` and reload

### PM2 not starting on boot

1. Re-run startup command:
   ```bash
   pm2 startup
   # Run the command it shows
   ```

2. Save configuration:
   ```bash
   pm2 save
   ```

## Production Checklist

- [ ] Environment variables configured in `.env.production`
- [ ] PM2 installed globally
- [ ] pnpm installed
- [ ] Application builds successfully (`pnpm run build`)
- [ ] PM2 startup configured for auto-start on reboot
- [ ] Firewall configured to allow traffic on application port
- [ ] Reverse proxy (nginx/Apache) configured if needed
- [ ] SSL certificate configured if using HTTPS
- [ ] Database connection working
- [ ] Redis connection working (if used)
- [ ] Logs directory exists and writable
- [ ] PM2 process saved (`pm2 save`)

## Nginx Reverse Proxy (Optional)

If you want to use nginx as reverse proxy:

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
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Useful Links

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PM2 Cluster Mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)

## Support

For issues related to:
- **PM2:** Check PM2 logs and documentation
- **Next.js:** Check Next.js build output and logs
- **Application:** Check application logs in `./logs/` directory
