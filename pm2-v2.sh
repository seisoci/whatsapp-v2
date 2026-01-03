#!/bin/bash

# PM2 Update and Reload Script
# Script untuk update dependencies, rebuild, dan reload aplikasi Next.js dengan PM2

set -e  # Exit on error

# Colors untuk output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# App name di PM2
APP_NAME="isomorphic-app"

echo -e "${BLUE}==================================================${NC}"
echo -e "${BLUE}  PM2 Update & Reload Script${NC}"
echo -e "${BLUE}==================================================${NC}"
echo ""

# Function untuk print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check apakah PM2 terinstall
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 tidak ditemukan. Install PM2 terlebih dahulu:"
    echo "  npm install -g pm2"
    exit 1
fi

# Check apakah pnpm terinstall
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm tidak ditemukan. Install pnpm terlebih dahulu:"
    echo "  corepack enable pnpm"
    exit 1
fi

print_info "Memulai proses update aplikasi..."
echo ""

# Step 1: Check apakah ada perubahan pada package.json
print_info "Memeriksa perubahan dependencies..."
PACKAGE_CHANGED=false

if [ -f "package.json" ]; then
    if git diff --name-only HEAD~1 HEAD 2>/dev/null | grep -q "package.json\|pnpm-lock.yaml"; then
        PACKAGE_CHANGED=true
        print_warning "Terdeteksi perubahan pada package.json atau pnpm-lock.yaml"
    fi
fi

# Step 2: Install/Update dependencies jika diperlukan
if [ "$PACKAGE_CHANGED" = true ]; then
    print_info "Menginstall/update dependencies..."
    pnpm install
    print_success "Dependencies berhasil diupdate"
    echo ""
else
    print_info "Tidak ada perubahan dependencies, skip install"
    echo ""
fi

# Step 3: Build aplikasi
print_info "Building aplikasi..."
if pnpm build; then
    print_success "Build berhasil"
    echo ""
else
    print_error "Build gagal!"
    print_info "Silakan periksa error di atas dan perbaiki sebelum deploy"
    exit 1
fi

# Step 4: Check apakah aplikasi sudah running di PM2
print_info "Memeriksa status PM2..."
if pm2 describe "$APP_NAME" &> /dev/null; then
    print_info "Aplikasi '$APP_NAME' ditemukan di PM2"

    # Step 5: Reload aplikasi (zero-downtime)
    print_info "Melakukan reload aplikasi..."
    if pm2 reload "$APP_NAME"; then
        print_success "Reload berhasil (zero-downtime)"
    else
        print_warning "Reload gagal, mencoba restart..."
        if pm2 restart "$APP_NAME"; then
            print_success "Restart berhasil"
        else
            print_error "Restart gagal!"
            exit 1
        fi
    fi
else
    print_warning "Aplikasi '$APP_NAME' tidak ditemukan di PM2"
    print_info "Memulai aplikasi baru..."

    # Check apakah ada ecosystem.config.js
    if [ -f "ecosystem.config.js" ]; then
        pm2 start ecosystem.config.js
        print_success "Aplikasi berhasil distart menggunakan ecosystem.config.js"
    else
        pm2 start npm --name "$APP_NAME" -- start
        print_success "Aplikasi berhasil distart"
    fi
fi

echo ""
print_info "Menyimpan konfigurasi PM2..."
pm2 save

echo ""
print_success "Update selesai!"
echo ""
print_info "Status aplikasi:"
pm2 status "$APP_NAME"

echo ""
print_info "Untuk melihat logs, jalankan:"
echo -e "  ${GREEN}pm2 logs $APP_NAME${NC}"
echo ""
print_info "Untuk monitoring, jalankan:"
echo -e "  ${GREEN}pm2 monit${NC}"
echo ""

echo -e "${BLUE}==================================================${NC}"
echo -e "${GREEN}  Deploy berhasil! Aplikasi sudah running.${NC}"
echo -e "${BLUE}==================================================${NC}"
