#!/usr/bin/env bash
# One-command Vercel deploy for dkcoleman.
#
# Prereqs: `vercel` CLI installed, and a Vercel token available as either
# $VERCEL_TOKEN in the environment or a VERCEL_TOKEN=... line in .env.local.
# (Create one at https://vercel.com/account/tokens.)
#
# Usage:
#   scripts/vercel-deploy.sh main      # deploy the main site (this repo root)
#   scripts/vercel-deploy.sh rentals   # deploy the rentals app (rentals/)
#
# It pushes the relevant env vars from the local env file to the Vercel project
# (production scope) and then deploys to production.
set -euo pipefail

TARGET="${1:-main}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Load VERCEL_TOKEN from .env.local if not already set.
if [ -z "${VERCEL_TOKEN:-}" ] && [ -f .env.local ]; then
  VERCEL_TOKEN="$(grep -E '^VERCEL_TOKEN=' .env.local | head -1 | cut -d= -f2- | tr -d '"' || true)"
fi
if [ -z "${VERCEL_TOKEN:-}" ]; then
  echo "ERROR: no VERCEL_TOKEN. Add VERCEL_TOKEN=... to .env.local or export it." >&2
  exit 1
fi
export VERCEL_TOKEN

V() { vercel --token "$VERCEL_TOKEN" "$@"; }

push_env() {
  # push_env <ENV_FILE> <KEY1> <KEY2> ...
  local file="$1"; shift
  for key in "$@"; do
    local val
    val="$(grep -E "^${key}=" "$file" | head -1 | cut -d= -f2- | tr -d '"' || true)"
    [ -z "$val" ] && { echo "  skip $key (empty)"; continue; }
    # Remove then add so re-runs update the value.
    V env rm "$key" production -y >/dev/null 2>&1 || true
    printf '%s' "$val" | V env add "$key" production >/dev/null
    echo "  set $key"
  done
}

if [ "$TARGET" = "main" ]; then
  echo "== Linking main project =="
  V link --yes >/dev/null
  echo "== Pushing env vars =="
  push_env .env.local DATABASE_URL ADMIN_PASSWORD ADMIN_SECRET JWT_SECRET NEXT_PUBLIC_GA_ID \
    NOTION_TOKEN NOTION_DATABASE_ID NOTION_RESOURCES_DATABASE_ID NOTION_RESUME_PAGE_ID \
    NOTION_PROJECTS_DATABASE_ID NOTION_ABOUT_DATABASE_ID NOTION_RESUME_NARRATIVE_DATABASE_ID
  echo "== Deploying =="
  V deploy --prod --yes
  echo "Done. Add domain in Vercel: dkcoleman.com (A @ -> 76.76.21.21)"
elif [ "$TARGET" = "rentals" ]; then
  cd "$ROOT/rentals"
  echo "== Linking rentals project (root: rentals/) =="
  V link --yes >/dev/null
  echo "== Pushing env vars from rentals/.env.local =="
  push_env .env.local AUTH_SECRET GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET AUTH_URL ADMIN_EMAILS \
    DATABASE_URL STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY NOTIFY_WEBHOOK_URL
  echo "== Deploying =="
  V deploy --prod --yes
  echo "Done. Add domain in Vercel: rentals.dkcoleman.com (CNAME rentals -> cname.vercel-dns.com)"
else
  echo "Unknown target: $TARGET (use 'main' or 'rentals')" >&2
  exit 1
fi
