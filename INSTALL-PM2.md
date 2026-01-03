# Instalasi dan Deploy dengan PM2

Panduan ini menjelaskan cara menginstall, menjalankan, dan mengelola aplikasi Next.js menggunakan PM2 (Process Manager 2).

## Prerequisites

- Node.js v20.9 atau lebih tinggi
- pnpm v9.1.4 atau lebih tinggi
- PM2 (akan diinstall di langkah berikut)

## Instalasi PM2

```bash
# Install PM2 secara global
npm install -g pm2

# Verifikasi instalasi
pm2 --version
```

## Setup Aplikasi

### 1. Clone dan Install Dependencies

```bash
# Clone repository
git clone <repository-url>
cd isomorphic

# Enable pnpm
corepack enable pnpm

# Install dependencies
pnpm install
```

### 2. Konfigurasi Environment Variables

Buat file `.env.local` di root project:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=https://your-api-url.com

# Turnstile Configuration (optional)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-key

# Disable telemetry
NEXT_TELEMETRY_DISABLED=1
```

### 3. Build Aplikasi

```bash
# Build untuk production
pnpm build
```

## Konfigurasi PM2

Buat file `ecosystem.config.js` di root project:

```javascript
module.exports = {
  apps: [{
    name: 'isomorphic-app',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_TELEMETRY_DISABLED: 1
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
}
```

## Menjalankan Aplikasi

### Start Aplikasi

```bash
# Start dengan PM2
pm2 start ecosystem.config.js

# Atau start langsung
pm2 start npm --name "isomorphic-app" -- start
```

### Perintah PM2 Dasar

```bash
# Lihat status aplikasi
pm2 status

# Lihat logs
pm2 logs isomorphic-app

# Lihat logs secara real-time
pm2 logs isomorphic-app --lines 100

# Stop aplikasi
pm2 stop isomorphic-app

# Restart aplikasi
pm2 restart isomorphic-app

# Reload aplikasi (zero-downtime)
pm2 reload isomorphic-app

# Delete dari PM2
pm2 delete isomorphic-app

# Monitor resource usage
pm2 monit
```

## Auto-start saat Server Reboot

```bash
# Generate startup script
pm2 startup

# Jalankan command yang diberikan oleh PM2 (copy paste output)
# Contoh: sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u username --hp /home/username

# Save current PM2 process list
pm2 save
```

## Update dan Deploy

Gunakan script `pm2.sh` untuk memudahkan proses update:

```bash
# Berikan permission execute
chmod +x pm2.sh

# Jalankan update script
./pm2.sh
```

Script akan otomatis:
1. Install/update dependencies jika ada perubahan di package.json
2. Build ulang aplikasi
3. Reload PM2 jika diperlukan
4. Restart PM2 jika terjadi error saat reload

## Monitoring dan Troubleshooting

### Monitoring dengan PM2

```bash
# Install PM2 runtime monitoring (opsional)
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

### Troubleshooting

**Aplikasi tidak start:**
```bash
# Check logs untuk error
pm2 logs isomorphic-app --err

# Pastikan build berhasil
pnpm build

# Pastikan port tidak digunakan
lsof -i :3000
```

**Memory leak atau high memory usage:**
```bash
# Restart aplikasi
pm2 restart isomorphic-app

# Atau set auto restart pada memory limit
pm2 restart isomorphic-app --max-memory-restart 1G
```

**Aplikasi crash terus-menerus:**
```bash
# Check error logs
pm2 logs isomorphic-app --err --lines 200

# Lihat informasi detail
pm2 describe isomorphic-app

# Reset restart counter
pm2 reset isomorphic-app
```

## Production Best Practices

1. **Gunakan Cluster Mode** untuk multiple instances
2. **Setup Log Rotation** untuk mencegah log files terlalu besar
3. **Monitor Memory Usage** secara berkala
4. **Backup PM2 Configuration** dengan `pm2 save`
5. **Setup Alerts** untuk downtime monitoring
6. **Gunakan Environment Variables** untuk sensitive data

## Uninstall

```bash
# Stop semua aplikasi
pm2 stop all

# Delete semua aplikasi dari PM2
pm2 delete all

# Remove startup script
pm2 unstartup

# Uninstall PM2 (opsional)
npm uninstall -g pm2
```

## Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [PM2 Best Practices](https://pm2.keymetrics.io/docs/usage/best-practices/)
