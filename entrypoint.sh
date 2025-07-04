#!/bin/sh
set -e

# Set NEXT_PUBLIC_TZ to TZ if not already set
export NEXT_PUBLIC_TZ=${NEXT_PUBLIC_TZ:-$TZ}
export NEXTAUTH_URL=${NEXTAUTH_URL:-$BASE_URL}

# Run migrations
npx prisma migrate deploy

# Execute the original command
exec "$@"
