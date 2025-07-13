# -------------------------
# Base build stage
# -------------------------
    FROM node:20-alpine AS base

    RUN npm install -g pnpm
    WORKDIR /app
    
    COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
    
    COPY apps/ ./apps/
    COPY packages/entix-sdk/ ./packages/entix-sdk/
    COPY packages/errors/ ./packages/errors/
    
    RUN pnpm install --frozen-lockfile
    RUN pnpm build
    
    
# -------------------------
# Production stage
# -------------------------
    FROM node:20-alpine AS production
    
    RUN npm install -g pnpm
    WORKDIR /app
    
    # Copy pnpm lockfile so --frozen-lockfile works
    COPY --from=base /app/pnpm-lock.yaml ./
    
    COPY --from=base /app/apps/api/dist ./dist
    COPY --from=base /app/packages/entix-sdk/dist ./packages/entix-sdk/dist
    COPY --from=base /app/packages/errors/dist ./packages/errors/dist
    
    COPY --from=base /app/package.json ./
    COPY --from=base /app/apps/api/package.json ./apps/api/
    COPY --from=base /app/packages/entix-sdk/package.json ./packages/entix-sdk/
    COPY --from=base /app/packages/errors/package.json ./packages/errors/
    
    RUN pnpm install --frozen-lockfile --prod
    
    ENV NODE_ENV=production
    ENV PORT=3000
    
    EXPOSE 3000
    
    CMD ["node", "dist/server.js"]
    