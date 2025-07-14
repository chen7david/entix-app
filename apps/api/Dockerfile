# -------------------------
# Base build stage
# -------------------------
FROM node:20-alpine AS base

# Install pnpm globally
RUN npm install -g pnpm@9

# Set working directory
WORKDIR /app

# Copy workspace configuration files first (for better caching)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./

# Copy all source code (needed for proper workspace resolution)
COPY apps/ ./apps/
COPY packages/ ./packages/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build all packages and the API
RUN pnpm build

# -------------------------
# Production stage
# -------------------------
FROM node:20-alpine AS production

# Install pnpm globally
RUN npm install -g pnpm@9

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory
WORKDIR /app

# Copy pnpm lockfile for dependency installation
COPY --from=base /app/pnpm-lock.yaml ./

# Copy built API files
COPY --from=base /app/apps/api/dist ./dist

# Copy built shared packages
COPY --from=base /app/packages/entix-sdk/dist ./packages/entix-sdk/dist
COPY --from=base /app/packages/errors/dist ./packages/errors/dist

# Copy package.json files for dependency resolution
COPY --from=base /app/package.json ./
COPY --from=base /app/apps/api/package.json ./apps/api/
COPY --from=base /app/packages/entix-sdk/package.json ./packages/entix-sdk/
COPY --from=base /app/packages/errors/package.json ./packages/errors/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Start the application
CMD ["node", "dist/server.js"]
    