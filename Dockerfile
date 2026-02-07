# -----------------------------
# Dependencies
# -----------------------------
    FROM node:20 AS deps
    WORKDIR /app
    COPY package.json package-lock.json* ./
    RUN npm config set fetch-timeout 120000 \
     && npm config set fetch-retry-maxtimeout 120000 \
     && npm config set fetch-retry-mintimeout 1000 \
     && npm ci --prefer-offline --no-progress --fetch-timeout=120000
    
    # -----------------------------
    # Builder
    # -----------------------------
    FROM node:20 AS builder
    WORKDIR /app
    COPY --from=deps /app/node_modules ./node_modules
    COPY . .
    RUN npm run db:generate
    RUN npm run build
    
    # -----------------------------
    # Runner
    # -----------------------------
    FROM node:20 AS runner
    WORKDIR /app
    ENV NODE_ENV=production
    
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static
    COPY --from=builder /app/prisma ./prisma
    COPY --from=deps /app/node_modules ./node_modules
    
    COPY docker/entrypoint.sh /entrypoint.sh
    RUN chmod +x /entrypoint.sh
    
    EXPOSE 3000
    ENTRYPOINT ["/entrypoint.sh"]
    