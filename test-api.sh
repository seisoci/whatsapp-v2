#!/bin/bash

echo "=== Testing API Configuration ==="

echo -e "\n1. Backend Direct Test:"
curl -s http://localhost:3001/api/v1/auth/me | head -c 100
echo ""

echo -e "\n2. Frontend Proxy Test:"
curl -s http://localhost:3000/api/v1/auth/me | head -c 100
echo ""

echo -e "\n3. Environment Check:"
echo "NEXT_PUBLIC_API_URL: $(grep NEXT_PUBLIC_API_URL .env | cut -d '=' -f2)"
echo "NEXT_PUBLIC_API_PREFIX: $(grep NEXT_PUBLIC_API_PREFIX .env | cut -d '=' -f2)"
echo "BACKEND_URL: $(grep BACKEND_URL .env | cut -d '=' -f2)"

echo -e "\n4. Server Status:"
lsof -i :3001 -t > /dev/null && echo "Backend (3001): Running ✅" || echo "Backend (3001): Stopped ❌"
lsof -i :3000 -t > /dev/null && echo "Frontend (3000): Running ✅" || echo "Frontend (3000): Stopped ❌"

echo -e "\n=== Done ==="
