#!/bin/bash
set -e

# Load environment variables from .env
if [ -f "$(dirname "$0")/.env" ]; then
  export $(grep -v '^#' "$(dirname "$0")/.env" | xargs)
fi

echo "==> Installing dependencies..."
npm install

echo "==> Checking database connection..."
if ! psql "$DATABASE_URL" -c '\q' 2>/dev/null; then
  echo "ERROR: Cannot connect to database. Make sure PostgreSQL is running."
  echo "  DATABASE_URL=$DATABASE_URL"
  exit 1
fi

echo "==> Generating Prisma client..."
npx prisma generate

echo "==> Running database migrations..."
npx prisma migrate deploy

echo "==> Starting dev server at http://localhost:3456"
PORT=3456 npm run dev
