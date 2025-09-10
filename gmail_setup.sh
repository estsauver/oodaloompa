#!/bin/bash
# Gmail Setup Script
# Set these environment variables before running this script:
# - GMAIL_CLIENT_ID: Your Gmail OAuth client ID
# - GMAIL_CLIENT_SECRET: Your Gmail OAuth client secret  
# - GMAIL_REFRESH_TOKEN: Your Gmail refresh token from OAuth playground

# Check if required environment variables are set
if [ -z "$GMAIL_CLIENT_ID" ]; then
    echo "Error: GMAIL_CLIENT_ID environment variable is not set"
    exit 1
fi

if [ -z "$GMAIL_CLIENT_SECRET" ]; then
    echo "Error: GMAIL_CLIENT_SECRET environment variable is not set"
    exit 1
fi

if [ -z "$GMAIL_REFRESH_TOKEN" ]; then
    echo "Error: GMAIL_REFRESH_TOKEN environment variable is not set"
    exit 1
fi

# Kill existing backend
pkill -f "efl_backend"

# Start backend with Gmail credentials
cd efl-backend
DATABASE_URL=sqlite://app.db \
SQLITE_URL=sqlite://app.db \
SLACK_SIGNING_SECRET=dev-skip \
GMAIL_CLIENT_ID="$GMAIL_CLIENT_ID" \
GMAIL_CLIENT_SECRET="$GMAIL_CLIENT_SECRET" \
GMAIL_REFRESH_TOKEN="$GMAIL_REFRESH_TOKEN" \
RUST_LOG=info \
cargo run