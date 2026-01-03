#!/bin/bash

# Environment Setup Helper
# This script helps fix common environment variable issues

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Environment Setup Helper${NC}"
echo -e "${BLUE}========================================${NC}"

# Determine which env file to use
ENV_FILE=""
if [ -f .env.production ]; then
    ENV_FILE=".env.production"
elif [ -f .env.local ]; then
    ENV_FILE=".env.local"
elif [ -f .env ]; then
    ENV_FILE=".env"
else
    echo -e "${RED}❌ No environment file found${NC}"
    echo -e "${YELLOW}Creating .env.local...${NC}"
    ENV_FILE=".env.local"

    if [ -f .env.local.example ]; then
        cp .env.local.example .env.local
        echo -e "${GREEN}✅ Created .env.local from .env.local.example${NC}"
    else
        touch .env.local
        echo -e "${GREEN}✅ Created empty .env.local${NC}"
    fi
fi

echo -e "\n${BLUE}Working with: ${ENV_FILE}${NC}"

# Fix NEXTAUTH_SECRET if it contains shell command
if grep -q 'NEXTAUTH_SECRET=\$(' "$ENV_FILE" 2>/dev/null; then
    echo -e "\n${YELLOW}⚠️  Found unexpanded NEXTAUTH_SECRET${NC}"
    echo -e "${BLUE}Generating new secret...${NC}"

    # Generate new secret
    NEW_SECRET=$(openssl rand -base64 32)

    # Replace in file
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEW_SECRET}|" "$ENV_FILE"
    else
        # Linux
        sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=${NEW_SECRET}|" "$ENV_FILE"
    fi

    echo -e "${GREEN}✅ NEXTAUTH_SECRET updated with generated value${NC}"
else
    echo -e "${GREEN}✅ NEXTAUTH_SECRET is already set${NC}"
fi

# Check and add NEXTAUTH_URL if missing
if ! grep -q "^NEXTAUTH_URL=" "$ENV_FILE" 2>/dev/null; then
    echo -e "\n${YELLOW}⚠️  NEXTAUTH_URL not found${NC}"
    echo -e "${BLUE}Adding NEXTAUTH_URL...${NC}"

    # Determine port (default 3000)
    PORT=3000
    if grep -q "^PORT=" "$ENV_FILE" 2>/dev/null; then
        PORT=$(grep "^PORT=" "$ENV_FILE" | cut -d'=' -f2)
    fi

    # Add NEXTAUTH_URL
    echo "" >> "$ENV_FILE"
    echo "NEXTAUTH_URL=http://localhost:${PORT}" >> "$ENV_FILE"

    echo -e "${GREEN}✅ NEXTAUTH_URL added: http://localhost:${PORT}${NC}"
else
    CURRENT_URL=$(grep "^NEXTAUTH_URL=" "$ENV_FILE" | cut -d'=' -f2-)
    echo -e "${GREEN}✅ NEXTAUTH_URL is set: ${CURRENT_URL}${NC}"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Environment setup completed!${NC}"
echo -e "${BLUE}========================================${NC}"

echo -e "\n${YELLOW}Current configuration in ${ENV_FILE}:${NC}"
echo -e "${BLUE}NEXTAUTH_SECRET:${NC} $(grep '^NEXTAUTH_SECRET=' "$ENV_FILE" | cut -c1-25)..."
echo -e "${BLUE}NEXTAUTH_URL:${NC}    $(grep '^NEXTAUTH_URL=' "$ENV_FILE" | cut -d'=' -f2-)"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Review ${ENV_FILE} and update values as needed"
echo -e "  2. For production, update NEXTAUTH_URL to your domain"
echo -e "  3. Run deployment: ${GREEN}./pm2.sh${NC}"

echo -e "\n${YELLOW}Note:${NC}"
echo -e "  - Keep NEXTAUTH_SECRET secure and never commit to git"
echo -e "  - Update NEXTAUTH_URL for production deployment"
