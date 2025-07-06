#!/bin/sh
set -e

# Set NEXT_PUBLIC_TZ to TZ if not already set
export NEXT_PUBLIC_TZ=${NEXT_PUBLIC_TZ:-$TZ}
export NEXTAUTH_URL=${NEXTAUTH_URL:-$BASE_URL}

# Handle PUID and PGID for user creation
PUID=${PUID:-1000}
PGID=${PGID:-1000}

if [ "$(id -u)" = $PUID ]; then
    echo "
    User uid:    $PUID
    User gid:    $PGID
    "
elif [ "$(id -u)" = "0" ]; then
    echo "Creating new user"
    # If container is started as root then create a new user and switch to it

    # Create group if it doesn't exist
    if ! getent group $PGID > /dev/null 2>&1; then
        addgroup -g $PGID cashflow
        echo "Group $PGID created"
    fi
    # Create user if it doesn't exist
    if ! getent passwd $PUID > /dev/null 2>&1; then
        adduser -D --uid $PUID --gid $PGID cashflow
        echo "User $PUID created"
    fi

    echo "Setting ownership of /app to $PUID:$PGID"
    chown -R $PUID:$PGID /app
fi

# Run migrations as the new user
gosu $PUID:$PGID npx prisma migrate deploy

# Execute the original command as the new user
exec gosu $PUID:$PGID "$@"
