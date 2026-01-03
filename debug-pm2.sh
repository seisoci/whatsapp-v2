#!/bin/bash

# Debug PM2 Issues
# Run this on the server to diagnose PM2 problems

echo "=== PM2 Status ==="
pm2 status

echo -e "\n=== PM2 Info for smartitn ==="
pm2 info smartitn

echo -e "\n=== Last 50 Error Lines ==="
pm2 logs smartitn --err --lines 50 --nostream

echo -e "\n=== Last 50 Output Lines ==="
pm2 logs smartitn --out --lines 50 --nostream

echo -e "\n=== Check if Next.js binary exists ==="
ls -la node_modules/.bin/next

echo -e "\n=== Check if .next folder exists ==="
ls -la .next/ 2>/dev/null || echo ".next folder not found - did you run build?"

echo -e "\n=== Try running Next.js manually ==="
echo "Run this command to test manually:"
echo "NODE_ENV=production PORT=3000 node_modules/.bin/next start"
