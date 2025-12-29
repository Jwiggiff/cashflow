# Stage 1: Dependencies
FROM node:22-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci


# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# Build arguments for version info
ARG GIT_HASH=unknown

# Generate version info during build
RUN VERSION=$(node -p "require('./package.json').version") && \
    BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ") && \
    echo "{\"version\":\"$VERSION\",\"gitHash\":\"$GIT_HASH\",\"buildDate\":\"$BUILD_DATE\",\"githubUrl\":\"https://github.com/jwiggiff/cashflow/commit/$GIT_HASH\"}" > lib/version.json

# Generate Prisma client
RUN npx prisma generate

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Environment variables
ENV NODE_ENV=production
ENV AUTH_TRUST_HOST=true
ENV TZ=America/New_York

# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

# Install gosu for user switching
RUN apk add --no-cache gosu

# Default PUID and PGID (will be overridden by environment variables)
ENV PUID=1000
ENV PGID=1000

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Copy and setup entrypoint script
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY --from=builder /app/public ./public

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

RUN npm install -g prisma@6.13.0

EXPOSE 3000

ENV PORT=3000

ENV HOSTNAME="0.0.0.0"

# Set the entrypoint
ENTRYPOINT ["/entrypoint.sh"]

CMD ["node", "server.js"]