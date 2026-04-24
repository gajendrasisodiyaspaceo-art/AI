#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# InterviewAI — Backend Deploy Script
# Deploys Supabase Edge Functions and DB migrations, then sets Stripe secrets.
#
# Usage:
#   ./scripts/deploy-backend.sh
#
# Prerequisites:
#   1. supabase login          (run once)
#   2. Set env vars below or export them before running this script
# ─────────────────────────────────────────────────────────────────────────────

set -e

PROJECT_REF="caxazzyvlfbnphxkgkyv"

# ── Stripe secrets ────────────────────────────────────────────────────────────
# Fill these in or export them from your environment before running
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
STRIPE_PRICE_ID="${STRIPE_PRICE_ID:-}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"

echo ""
echo "🚀 InterviewAI Backend Deploy"
echo "─────────────────────────────"

# ── Validate secrets ──────────────────────────────────────────────────────────
if [[ -z "$STRIPE_SECRET_KEY" ]]; then
  echo "❌ STRIPE_SECRET_KEY is not set."
  echo "   Export it: export STRIPE_SECRET_KEY=sk_live_..."
  exit 1
fi

if [[ -z "$STRIPE_PRICE_ID" ]]; then
  echo "❌ STRIPE_PRICE_ID is not set."
  echo "   Export it: export STRIPE_PRICE_ID=price_..."
  exit 1
fi

if [[ -z "$STRIPE_WEBHOOK_SECRET" ]]; then
  echo "❌ STRIPE_WEBHOOK_SECRET is not set."
  echo "   Export it: export STRIPE_WEBHOOK_SECRET=whsec_..."
  exit 1
fi

# ── Push DB migrations ────────────────────────────────────────────────────────
echo ""
echo "📦 Pushing database migrations..."
supabase db push --project-ref "$PROJECT_REF"
echo "✅ DB migration done"

# ── Set Supabase secrets ──────────────────────────────────────────────────────
echo ""
echo "🔐 Setting Supabase secrets..."
supabase secrets set \
  STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
  STRIPE_PRICE_ID="$STRIPE_PRICE_ID" \
  STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
  --project-ref "$PROJECT_REF"
echo "✅ Secrets set"

# ── Deploy Edge Functions ─────────────────────────────────────────────────────
echo ""
echo "⚡ Deploying Edge Functions..."

FUNCTIONS=(
  "create-checkout-session"
  "create-portal-session"
  "validate-subscription"
  "stripe-webhook"
)

for fn in "${FUNCTIONS[@]}"; do
  echo "   → Deploying $fn..."
  supabase functions deploy "$fn" --project-ref "$PROJECT_REF" --no-verify-jwt
done

echo "✅ All Edge Functions deployed"

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "────────────────────────────────────────────"
echo "✅ Backend deploy complete!"
echo ""
echo "Next: Add the Stripe webhook endpoint in your Stripe dashboard:"
echo "  URL: https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook"
echo "  Events: checkout.session.completed, invoice.paid,"
echo "          customer.subscription.updated, customer.subscription.deleted,"
echo "          customer.deleted"
echo "────────────────────────────────────────────"
