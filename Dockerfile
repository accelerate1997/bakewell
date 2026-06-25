# Stage 1: Install dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Set Node memory limit during dependency installation
ENV NODE_OPTIONS="--max-old-space-size=1024"

# Install dependencies based on package-lock.json
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

# Stage 2: Rebuild the source code
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set Node memory limit to prevent build containers from running out of memory
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# Stage 3: Runner container
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy static assets and standalone server build files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + CLI + engines for runtime migrations
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Grant write access to Next.js cache directory
RUN mkdir -p .next && chown nextjs:nodejs .next

USER nextjs

EXPOSE 3000

# Apply migrations first, then run the Node.js server
# If migrations fail (e.g. already applied), still start the server
CMD ["sh", "-c", "npx prisma migrate deploy || echo 'Migration skipped or failed, starting server anyway...' && node server.js"]
