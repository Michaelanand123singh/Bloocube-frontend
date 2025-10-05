# syntax=docker/dockerfile:1.7

FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Install all dependencies (including devDependencies needed for build)
RUN npm ci

FROM node:20-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# DEBUG: Print the value during build
RUN echo "========================================="
RUN echo "🔍 Build-time NEXT_PUBLIC_API_URL: $NEXT_PUBLIC_API_URL"
RUN echo "========================================="

# Fail build if NEXT_PUBLIC_API_URL is not set
RUN if [ -z "$NEXT_PUBLIC_API_URL" ]; then \
      echo "❌ ERROR: NEXT_PUBLIC_API_URL is empty or not set!"; \
      echo "Please check your cloudbuild.yaml substitutions."; \
      exit 1; \
    fi

RUN npm run build

# DEBUG: Verify the API URL is embedded in the build
RUN echo "========================================="
RUN echo "🔍 Checking if API URL is embedded in build..."
RUN grep -r "api-backend.bloocube.com" .next/static/ | head -n 3 || echo "⚠️  WARNING: API URL not found in static files"
RUN echo "========================================="

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Only copy what we need to run
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.* ./
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:'+process.env.PORT, r=>{if(r.statusCode<200||r.statusCode>=500)process.exit(1)}).on('error',()=>process.exit(1))" || exit 1

CMD ["npm", "run", "start"]