# ─── Stage 1: Builder ───────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app

# 1. Install all deps & build
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 2. Prune devDependencies so node_modules contains only prodDeps
RUN npm prune --production

# ─── Stage 2: Runner ────────────────────────────────────────────────────────────
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# 3. Copy package files & pruned node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# 4. Copy compiled output & config
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts

# 5. Expose & launch
EXPOSE 3000
CMD ["npm","start"]