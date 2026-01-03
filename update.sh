#!/bin/bash

# SNMP OLT Frontend - Update Script
# Zero-downtime deployment untuk Next.js application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_DIR="/var/www/snmp-olt-frontend"
BACKUP_DIR="$APP_DIR/backups"
LOG_FILE="$APP_DIR/update.log"
DOCKER_COMPOSE_FILE="$APP_DIR/docker-compose.prod.yml"

# Auto-fix mode (set to true to skip prompts)
AUTO_FIX_LOCKFILE="${AUTO_FIX_LOCKFILE:-false}"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to create backup
create_backup() {
    print_step "Creating backup..."

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/backup_$TIMESTAMP"

    mkdir -p "$BACKUP_PATH"

    # Backup current image
    print_info "Backing up current Docker image..."
    docker save snmp-olt-frontend:latest | gzip > "$BACKUP_PATH/frontend-image.tar.gz" 2>/dev/null || true

    # Backup .env file
    if [ -f "$APP_DIR/.env.production" ]; then
        cp "$APP_DIR/.env.production" "$BACKUP_PATH/.env.production"
    fi

    # Backup docker-compose
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        cp "$DOCKER_COMPOSE_FILE" "$BACKUP_PATH/docker-compose.prod.yml"
    fi

    print_info "Backup created at: $BACKUP_PATH"
}

# Function to check and auto-fix dependencies
check_dependencies() {
    print_step "Checking dependencies..."

    cd "$APP_DIR"

    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found!"
        exit 1
    fi

    # Check if pnpm-lock.yaml exists
    if [ ! -f "pnpm-lock.yaml" ]; then
        print_warning "pnpm-lock.yaml not found!"
        print_warning "Generating lockfile automatically..."

        if docker run --rm -v "$APP_DIR:/app" -w /app node:20-alpine sh -c "corepack enable pnpm && pnpm install --lockfile-only"; then
            print_info "✅ Lockfile generated successfully!"
        else
            print_error "Failed to generate lockfile"
            return 1
        fi
    fi

    # Verify package.json and lockfile are in sync (if lockfile exists)
    if [ -f "pnpm-lock.yaml" ]; then
        print_info "Verifying package.json and pnpm-lock.yaml are in sync..."

        # Try frozen-lockfile install to check sync
        if docker run --rm -v "$APP_DIR:/app" -w /app node:20-alpine sh -c "corepack enable pnpm && pnpm install --frozen-lockfile" > /dev/null 2>&1; then
            print_info "✅ Dependencies are in sync"
        else
            print_warning "⚠️  package.json and pnpm-lock.yaml are OUT OF SYNC!"
            print_warning ""

            # Auto-fix mode or prompt user
            if [ "$AUTO_FIX_LOCKFILE" = "true" ]; then
                print_info "Auto-fix mode enabled, updating lockfile..."
                AUTO_UPDATE=true
            else
                print_warning "Options:"
                print_warning "  1. Auto-update lockfile (recommended)"
                print_warning "  2. Cancel deployment"
                print_warning ""
                read -p "Auto-update lockfile? (Y/n): " -n 1 -r
                echo ""

                if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
                    AUTO_UPDATE=true
                else
                    AUTO_UPDATE=false
                fi
            fi

            if [ "$AUTO_UPDATE" = true ]; then
                print_info "Updating pnpm-lock.yaml..."

                if docker run --rm -v "$APP_DIR:/app" -w /app node:20-alpine sh -c "corepack enable pnpm && pnpm install --lockfile-only"; then
                    print_info "✅ Lockfile updated successfully!"
                    print_info ""
                    print_info "⚠️  IMPORTANT: Commit the updated lockfile to git:"
                    print_info "   git add pnpm-lock.yaml"
                    print_info "   git commit -m 'chore: update pnpm-lock.yaml'"
                    print_info "   git push"
                    print_info ""
                    sleep 3
                else
                    print_error "Failed to update lockfile"
                    return 1
                fi
            else
                print_error "Deployment cancelled by user"
                exit 1
            fi
        fi
    fi

    print_info "Dependency check completed"
}

# Function to pull latest code
pull_latest_code() {
    print_step "Pulling latest code from repository..."

    cd "$APP_DIR"

    # Check if git repo exists
    if [ ! -d ".git" ]; then
        print_error "Not a git repository!"
        exit 1
    fi

    # Stash local changes (if any)
    git stash

    # Pull latest code
    git pull origin main || git pull origin master

    print_info "Code updated successfully"

    # Check dependencies after pull
    check_dependencies
}

# Function to rebuild Docker image
rebuild_image() {
    print_step "Rebuilding Docker image..."

    cd "$APP_DIR"

    # Load environment variables
    if [ -f ".env.production" ]; then
        export $(cat .env.production | grep -v '^#' | xargs)
    fi

    # Build new image with no cache
    print_info "Building new Docker image (this may take a few minutes)..."
    docker-compose -f docker-compose.prod.yml build --no-cache

    print_info "Image rebuilt successfully"
}

# Function to deploy new version
deploy_new_version() {
    print_step "Deploying new version..."

    cd "$APP_DIR"

    # Stop old container gracefully
    print_info "Stopping old container..."
    docker-compose -f docker-compose.prod.yml down --timeout 30

    # Start new container
    print_info "Starting new container..."
    docker-compose -f docker-compose.prod.yml up -d

    # Wait for container to be ready
    print_info "Waiting for container to be ready..."
    sleep 10

    print_info "New version deployed successfully"
}

# Function to verify deployment
verify_deployment() {
    print_step "Verifying deployment..."

    # Wait a bit for the app to fully start
    sleep 5

    # Check if container is running
    if ! docker ps | grep -q "snmp-olt-frontend"; then
        print_error "Container is not running!"
        return 1
    fi

    # Check frontend health
    print_info "Checking frontend health..."
    local max_attempts=10
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")

        if [ "$FRONTEND_STATUS" = "200" ]; then
            print_info "Frontend is healthy (HTTP $FRONTEND_STATUS) ✓"
            return 0
        fi

        print_warning "Attempt $attempt/$max_attempts: Frontend not ready yet (HTTP $FRONTEND_STATUS)"
        sleep 3
        attempt=$((attempt + 1))
    done

    print_error "Frontend health check failed after $max_attempts attempts"
    return 1
}

# Function to rollback
rollback() {
    print_error "Rolling back to previous version..."

    # Find latest backup
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR" | head -1)

    if [ -z "$LATEST_BACKUP" ]; then
        print_error "No backup found for rollback"
        return 1
    fi

    print_info "Rolling back to: $LATEST_BACKUP"

    # Stop current container
    cd "$APP_DIR"
    docker-compose -f docker-compose.prod.yml down

    # Load previous image
    if [ -f "$BACKUP_DIR/$LATEST_BACKUP/frontend-image.tar.gz" ]; then
        print_info "Restoring previous Docker image..."
        gunzip -c "$BACKUP_DIR/$LATEST_BACKUP/frontend-image.tar.gz" | docker load
    fi

    # Restore env file
    if [ -f "$BACKUP_DIR/$LATEST_BACKUP/.env.production" ]; then
        cp "$BACKUP_DIR/$LATEST_BACKUP/.env.production" "$APP_DIR/.env.production"
    fi

    # Start with old image
    docker-compose -f docker-compose.prod.yml up -d

    print_info "Rollback completed"
}

# Function to cleanup old backups
cleanup_old_backups() {
    print_step "Cleaning up old backups (keeping last 5)..."

    cd "$BACKUP_DIR"
    BACKUP_COUNT=$(ls -1 | wc -l)

    if [ "$BACKUP_COUNT" -gt 5 ]; then
        ls -t | tail -n +6 | xargs -r rm -rf
        print_info "Old backups cleaned up"
    else
        print_info "No old backups to clean up ($BACKUP_COUNT total)"
    fi
}

# Function to show container logs
show_logs() {
    print_info "Showing last 50 lines of container logs..."
    docker logs --tail 50 snmp-olt-frontend
}

# Function to show container stats
show_stats() {
    print_info "Container statistics:"
    docker stats snmp-olt-frontend --no-stream
}

# Main execution
main() {
    echo ""
    echo "========================================="
    print_info "SNMP OLT Frontend - Deployment Update"
    echo "========================================="
    echo ""

    # Check if running as root or with sudo
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. This is not recommended."
    fi

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Create directories if they don't exist
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"

    # Log start time
    echo "Deployment started at: $(date)" >> "$LOG_FILE"

    # Step 1: Create backup
    create_backup

    # Step 2: Pull latest code
    pull_latest_code

    # Step 3: Rebuild Docker image
    rebuild_image

    # Step 4: Deploy new version
    deploy_new_version

    # Step 5: Verify deployment
    if verify_deployment; then
        echo ""
        echo "========================================="
        print_info "✅ Deployment completed successfully!"
        echo "========================================="
        echo ""

        # Show stats
        show_stats

        # Cleanup old backups
        cleanup_old_backups

        print_info "Frontend is running at: http://localhost:3000"
        print_info "Log file: $LOG_FILE"

    else
        echo ""
        echo "========================================="
        print_error "❌ Deployment verification failed!"
        echo "========================================="
        echo ""

        # Show logs for debugging
        show_logs

        print_warning "Do you want to rollback? (y/n)"
        read -r response

        if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
            rollback

            if verify_deployment; then
                print_info "Rollback successful!"
            else
                print_error "Rollback verification failed. Please check manually."
            fi
        else
            print_info "Skipping rollback. Please check logs manually."
        fi

        exit 1
    fi

    # Log end time
    echo "Deployment finished at: $(date)" >> "$LOG_FILE"
}

# Parse command line arguments
case "${1:-}" in
    logs)
        docker logs -f snmp-olt-frontend
        ;;
    stats)
        docker stats snmp-olt-frontend
        ;;
    restart)
        print_info "Restarting container..."
        cd "$APP_DIR"
        docker-compose -f docker-compose.prod.yml restart
        ;;
    stop)
        print_info "Stopping container..."
        cd "$APP_DIR"
        docker-compose -f docker-compose.prod.yml down
        ;;
    start)
        print_info "Starting container..."
        cd "$APP_DIR"
        docker-compose -f docker-compose.prod.yml up -d
        ;;
    rollback)
        rollback
        ;;
    *)
        main "$@"
        ;;
esac
