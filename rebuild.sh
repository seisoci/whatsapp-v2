#!/bin/bash

set -e

echo "🐳 Docker Rebuild Script"
echo "========================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Ask for rebuild type
echo "Select rebuild option:"
echo "1) Full rebuild (both frontend & backend)"
echo "2) Frontend only"
echo "3) Backend only"
echo "4) Clean rebuild (remove all cache)"
echo ""
read -p "Enter choice [1-4]: " choice

case $choice in
    1)
        echo ""
        print_step "Stopping containers..."
        docker compose down

        print_step "Rebuilding all images (no cache)..."
        docker compose build --no-cache

        print_step "Starting containers..."
        docker compose up -d

        print_step "Waiting for services to start..."
        sleep 5

        echo ""
        echo "📊 Container Status:"
        docker compose ps

        echo ""
        echo "📝 Logs (Ctrl+C to exit):"
        docker compose logs -f
        ;;

    2)
        echo ""
        print_step "Rebuilding frontend only..."
        docker compose build --no-cache omnichat-ui

        print_step "Starting frontend..."
        docker compose up -d omnichat-ui

        print_step "Waiting for service to start..."
        sleep 3

        echo ""
        echo "📊 Container Status:"
        docker compose ps omnichat-ui

        echo ""
        echo "📝 Frontend Logs (Ctrl+C to exit):"
        docker compose logs -f omnichat-ui
        ;;

    3)
        echo ""
        print_step "Rebuilding backend only..."
        docker compose build --no-cache omnichat-api

        print_step "Starting backend..."
        docker compose up -d omnichat-api

        print_step "Waiting for service to start..."
        sleep 3

        echo ""
        echo "📊 Container Status:"
        docker compose ps omnichat-api

        echo ""
        echo "📝 Backend Logs (Ctrl+C to exit):"
        docker compose logs -f omnichat-api
        ;;

    4)
        echo ""
        print_warning "This will remove all containers, images, and build cache!"
        read -p "Are you sure? (y/N): " confirm

        if [[ $confirm == [yY] || $confirm == [yY][eE][sS] ]]; then
            print_step "Stopping and removing containers..."
            docker compose down -v --rmi all

            print_step "Removing Docker build cache..."
            docker builder prune -a -f

            print_step "Rebuilding from scratch..."
            docker compose build --no-cache

            print_step "Starting containers..."
            docker compose up -d

            print_step "Waiting for services to start..."
            sleep 5

            echo ""
            echo "📊 Container Status:"
            docker compose ps

            echo ""
            echo "📝 Logs (Ctrl+C to exit):"
            docker compose logs -f
        else
            print_error "Clean rebuild cancelled"
            exit 0
        fi
        ;;

    *)
        print_error "Invalid choice!"
        exit 1
        ;;
esac

echo ""
print_step "Done!"
