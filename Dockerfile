# -----------------------------
# Dependencies
# -----------------------------
    FROM node:20 AS deps
    WORKDIR /app
    COPY package.json package-lock.json* ./
    RUN npm ci
    
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
    
    # Copy runtime files
    COPY --from=builder /app/public ./public
    COPY --from=builder /app/.next/standalone ./
    COPY --from=builder /app/.next/static ./.next/static
    COPY --from=builder /app/prisma ./prisma
    
    # Prisma CLI is needed at runtime for db push (we use npx prisma)
    COPY --from=deps /app/node_modules ./node_modules
    
    # Entrypoint to initialize DB
    COPY docker/entrypoint.sh /entrypoint.sh
    RUN chmod +x /entrypoint.sh
    
    EXPOSE 3000
    ENTRYPOINT ["/entrypoint.sh"]
    