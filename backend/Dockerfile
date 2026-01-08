# Stage 1: Install dependencies
FROM oven/bun:1 as deps
WORKDIR /app

# Copy package files
COPY package.json bun.lock ./

# Install production dependencies
RUN bun install --frozen-lockfile --production

# Stage 2: Runner
FROM oven/bun:1 as runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy source code and config files
COPY package.json bun.lock tsconfig.json ./
COPY src ./src



# Start the application
CMD ["bun", "run", "start"]
