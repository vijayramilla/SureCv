#!/usr/bin/env bash
# Push required env vars from local .env to the Vercel project.
# Usage: VERCEL_TOKEN=<token> bash scripts/vercel-push-env.sh [project] [teamId]
set -euo pipefail

TOKEN="${VERCEL_TOKEN:?Set VERCEL_TOKEN}"
PROJECT="${1:-surecv}"
TEAM_ARG=()
[ -n "${VERCEL_TEAM:-}" ] && TEAM_ARG=(--team-id "$VERCEL_TEAM")

ENVIRONMENTS="${ENVIRONMENTS:-production preview}"

[ -f .env ] || { echo ".env not found"; exit 1; }
# shellcheck disable=SC1091
set -a; source ./.env; set +a

push_env() {
  local name="$1" value="$2"
  if [ -z "$value" ]; then
    echo "· $name (skipped — not set in .env)"
    return 0
  fi
  for e in $ENVIRONMENTS; do
    printf '%s' "$value" | npx --yes vercel env add "$name" "$e" \
      --project "$PROJECT" "${TEAM_ARG[@]}" --token "$TOKEN" --yes >/dev/null 2>&1 \
      && echo "✓ $name ($e)" || echo "⚠ failed: $name ($e)"
  done
}

echo "Pushing env vars to Vercel project '$PROJECT'..."

# Server-only secret (never baked into the client bundle)
push_env NVIDIA_API_KEY "${NVIDIA_API_KEY:-}"

# Skip puppeteer Chromium download during Vercel installs (not used by serverless functions)
push_env PUPPETEER_SKIP_DOWNLOAD "1"

# Public build-time variables (safe to embed in the client bundle)
push_env VITE_FIREBASE_API_KEY "${VITE_FIREBASE_API_KEY:-}"
push_env VITE_FIREBASE_AUTH_DOMAIN "${VITE_FIREBASE_AUTH_DOMAIN:-}"
push_env VITE_FIREBASE_PROJECT_ID "${VITE_FIREBASE_PROJECT_ID:-}"
push_env VITE_FIREBASE_STORAGE_BUCKET "${VITE_FIREBASE_STORAGE_BUCKET:-}"
push_env VITE_FIREBASE_MESSAGING_SENDER_ID "${VITE_FIREBASE_MESSAGING_SENDER_ID:-}"
push_env VITE_FIREBASE_APP_ID "${VITE_FIREBASE_APP_ID:-}"
push_env VITE_FIREBASE_MEASUREMENT_ID "${VITE_FIREBASE_MEASUREMENT_ID:-}"
push_env VITE_RAZORPAY_KEY_ID "${VITE_RAZORPAY_KEY_ID:-}"

echo "Done. Note: VITE_API_URL / VITE_SCRAPER_API_URL are intentionally NOT set —"
echo "the site uses same-origin /api/* (Vercel functions) and client-side fallbacks."
