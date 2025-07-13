# Use Node.js 20 Alpine as base image
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy the entire monorepo (needed for workspace dependencies)
COPY ../../ .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the API application
RUN pnpm build --filter=api

# Production stage
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration
COPY ../../package.json ../../pnpm-lock.yaml ../../pnpm-workspace.yaml ./
COPY ../package.json ./apps/api/
COPY ../../packages/entix-sdk/package.json ./packages/entix-sdk/
COPY ../../packages/api-errors/package.json ./packages/api-errors/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from build stage
COPY --from=base /app/apps/api/dist ./apps/api/dist
COPY --from=base /app/packages/entix-sdk/dist ./packages/entix-sdk/dist
COPY --from=base /app/packages/api-errors/dist ./packages/api-errors/dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "apps/api/dist/server.js"] 