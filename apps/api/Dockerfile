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

# Copy only the built API application
COPY --from=base /app/apps/api/dist ./dist

# Copy only the built SDK packages that the API depends on
COPY --from=base /app/packages/entix-sdk/dist ./packages/entix-sdk/dist
COPY --from=base /app/packages/api-errors/dist ./packages/api-errors/dist

# Copy only the package.json files needed for runtime
COPY ../../package.json ./
COPY ../package.json ./apps/api/
COPY ../../packages/entix-sdk/package.json ./packages/entix-sdk/
COPY ../../packages/api-errors/package.json ./packages/api-errors/

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/server.js"] 