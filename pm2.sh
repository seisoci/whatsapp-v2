#!/bin/bash
# Don't exit on error for install step
set +e

# =====================================================
# CONFIG
# =====================================================
APP_NAME="smartitn"
PORT="${PORT:-3000}"
PM2_INSTANCES="${PM2_INSTANCES:-1}"
NODE_ENV="production"
CURRENT_DIR="$(pwd)"

echo "========================================"
echo " Deploying Next.js App: ${APP_NAME}"
echo "========================================"

# =====================================================
# CHECK DEPENDENCIES
# =====================================================
command -v pm2 >/dev/null || { echo "❌ pm2 not found"; exit 1; }
command -v pnpm >/dev/null || { echo "❌ pnpm not found"; exit 1; }

# =====================================================
# LOAD ENV (CRITICAL FOR NEXT.JS)
# =====================================================
ENV_FILE=""

if [ -f .env.production ]; then
  ENV_FILE=".env.production"
elif [ -f .env ]; then
  ENV_FILE=".env"
else
  echo "❌ No .env.production or .env file found"
  exit 1
fi

echo "📦 Using env file: ${ENV_FILE}"

# Export env BEFORE build
export $(grep -v '^#' "$ENV_FILE" | xargs)
export NODE_ENV=production
export PORT=$PORT

# =====================================================
# SAFETY CHECK
# =====================================================
if [[ "$NEXT_PUBLIC_API_URL" == *"localhost"* ]]; then
  echo "❌ NEXT_PUBLIC_API_URL masih localhost!"
  echo "   Value: $NEXT_PUBLIC_API_URL"
  exit 1
fi

# =====================================================
# DISABLE DEV HOOKS (HUSKY)
# =====================================================
export HUSKY=0
export CI=true

# =====================================================
# CLEAN OLD BUILD
# =====================================================
echo "🧹 Cleaning old build..."
rm -rf .next

# =====================================================
# INSTALL DEPENDENCIES
# =====================================================
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile --prod=false --no-optional 2>/dev/null || {
  echo "⚠️  Frozen lockfile issue detected, regenerating..."
  pnpm install --no-frozen-lockfile --prod=false --force
}

# =====================================================
# BUILD NEXT.JS
# =====================================================
echo "🔨 Building Next.js (production)..."
# Exit on error from this point
set -e
pnpm run build

# =====================================================
# VERIFY BUILD OUTPUT
# =====================================================
if grep -R "localhost:8000" .next >/dev/null; then
  echo "❌ BUILD MASIH MENGANDUNG localhost:8000"
  exit 1
else
  echo "✅ Build clean (no localhost)"
fi

# =====================================================
# CREATE PM2 ECOSYSTEM
# =====================================================
echo "📝 Creating PM2 ecosystem config..."

# Parse env file and create proper JSON format
ENV_VARS="NODE_ENV: 'production',
      PORT: ${PORT},"

while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue

  # Remove quotes from value
  value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

  # Add to env vars
  ENV_VARS="${ENV_VARS}
      ${key}: '${value}',"
done < "$ENV_FILE"

# Remove trailing comma
ENV_VARS=$(echo "$ENV_VARS" | sed '$ s/,$//')

cat > ecosystem.config.js <<EOFJS
module.exports = {
  apps: [{
    name: '${APP_NAME}',
    script: 'pnpm',
    args: 'start',
    cwd: '${CURRENT_DIR}',
    instances: ${PM2_INSTANCES},
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      ${ENV_VARS}
    },
    error_file: '${CURRENT_DIR}/logs/pm2-error.log',
    out_file: '${CURRENT_DIR}/logs/pm2-out.log',
    log_file: '${CURRENT_DIR}/logs/pm2-combined.log',
    time: true,
    merge_logs: true
  }]
};
EOFJS

# Create logs directory
mkdir -p logs

# =====================================================
# DEPLOY WITH PM2
# =====================================================
if pm2 describe "$APP_NAME" >/dev/null 2>&1; then
  echo "♻ Reloading app..."
  pm2 reload ecosystem.config.js --update-env
else
  echo "🚀 Starting app..."
  pm2 start ecosystem.config.js
fi

pm2 save

echo "========================================"
echo "✅ DEPLOY SUCCESS"
echo "🌐 App running on port ${PORT}"
echo "========================================"
