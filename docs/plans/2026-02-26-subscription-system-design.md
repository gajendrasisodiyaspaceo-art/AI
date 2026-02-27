# InterviewAI Subscription System - Design Document

**Date:** 2026-02-26
**Status:** Approved

---

## Overview

Add a subscription-based monetization system to InterviewAI using **Supabase** (auth + database) and **Stripe** (payments). Users must sign up/login to use the app. Free tier has limited features; Pro tier unlocks everything.

## Decisions

| Decision | Choice | Reasoning |
|----------|--------|-----------|
| Payment Provider | Stripe | Most popular, reliable, good DX |
| Backend | Supabase | Auth + DB + Edge Functions, free tier, fast setup |
| Auth Method | Email + Password | Simple, Supabase built-in |
| Plans | Free + Pro | Simple 2-tier model |
| Payment Flow | Stripe Checkout (hosted) | No custom payment UI needed in app |

## Architecture

```
Electron App
  ├── Auth Screen (Supabase Auth - email/password)
  ├── Feature Gate (checks subscription plan)
  └── Supabase Client SDK (auth + db queries)
         │
         ▼ HTTPS
Supabase Cloud
  ├── Auth (email/password)
  ├── Database (Postgres)
  │     ├── profiles (user info + stripe_customer_id)
  │     ├── subscriptions (plan, status, period)
  │     └── daily_usage (question count per day)
  └── Edge Functions
        ├── create-checkout-session
        ├── stripe-webhook
        └── create-portal-session
         │
         ▼
Stripe
  ├── Checkout Session (hosted payment page)
  ├── Customer Portal (manage/cancel subscription)
  └── Webhooks → Supabase Edge Functions
```

## User Flow

1. App opens → Auth Screen (login/signup)
2. After auth → Check `hasCompletedSetup` → Setup Wizard if first time
3. After setup → Check `subscriptions` table → Free or Pro
4. Free user: limited features, "Upgrade" button available
5. "Upgrade" clicked → Edge Function creates Stripe Checkout → Opens in browser
6. User pays → Stripe webhook → Edge Function updates subscription → Pro activated
7. App refreshes subscription status → Pro features unlocked

## Database Schema

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',        -- 'free' | 'pro'
  status TEXT NOT NULL DEFAULT 'active',    -- 'active' | 'canceled' | 'past_due' | 'expired'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily usage tracking (free plan limits)
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  question_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);
```

**Trigger:** Auto-create profile + free subscription on user signup.

## Plan Limits

| Feature | Free | Pro |
|---------|------|-----|
| Daily Questions | 10 | Unlimited |
| Screen Capture | Disabled | Enabled |
| OCR | Disabled | Enabled |
| AI Models | All | All |
| Session History | Unlimited | Unlimited |
| Price | $0 | $9.99/month |

## Feature Gating

```typescript
interface UserSubscription {
  plan: 'free' | 'pro'
  status: 'active' | 'canceled' | 'past_due' | 'expired'
  currentPeriodEnd?: string
}

const PLAN_LIMITS = {
  free: {
    dailyQuestions: 10,
    ocrEnabled: false,
    screenCaptureEnabled: false,
  },
  pro: {
    dailyQuestions: Infinity,
    ocrEnabled: true,
    screenCaptureEnabled: true,
  }
}
```

**Gating points:**
- `InputArea.tsx` - Check question count, disable screen capture for free
- `useLiveChat.ts` - Increment usage, block if limit reached
- `useScreenCapture.ts` - Check plan before capture
- `useOCR.ts` - Check plan before processing

## New/Modified Screens

### New: Auth Screen
- Email + Password login/signup form
- Dark theme matching existing design
- Shows before setup wizard on first launch

### New: Upgrade/Subscription Screen
- Current plan info
- Pro features comparison list
- "Upgrade Now" button → Stripe Checkout
- "Manage Subscription" → Stripe Customer Portal

### Modified: App.tsx Flow
```
App Open → Auth Screen
  → Authenticated? → Check hasCompletedSetup
    → No → Setup Wizard → Main App
    → Yes → Main App (with feature gates based on plan)
```

### Modified: Settings Tab
- New "Account & Subscription" section at top
- Email display, plan badge, upgrade/manage button, logout button

### Modified: Live Tab
- Free: "X/10 questions remaining" badge in status bar
- Free: Screen capture button disabled with lock icon + "Pro" badge
- Limit reached: Show upgrade prompt overlay

## Supabase Edge Functions

### 1. `create-checkout-session`
- Creates Stripe customer if not exists
- Creates Stripe Checkout Session with price_id
- Returns checkout URL
- App opens URL in default browser

### 2. `stripe-webhook`
- Verifies Stripe signature
- Handles events:
  - `checkout.session.completed` → Set plan to 'pro'
  - `invoice.paid` → Extend period
  - `customer.subscription.deleted` → Set plan to 'free'
  - `customer.subscription.updated` → Update status/period

### 3. `create-portal-session`
- Creates Stripe Customer Portal session
- Returns portal URL for subscription management

## New Dependencies

| Package | Purpose |
|---------|---------|
| `@supabase/supabase-js` | Supabase client SDK for auth + db |

## New Files (Estimated)

```
src/
├── services/
│   ├── supabaseClient.ts       # Supabase client init
│   └── subscriptionService.ts  # Subscription check + usage tracking
├── hooks/
│   ├── useAuth.ts              # Auth state management
│   └── useSubscription.ts      # Subscription state + feature gates
├── components/
│   ├── AuthScreen/
│   │   └── AuthScreen.tsx      # Login/Signup form
│   ├── SubscriptionGate/
│   │   └── SubscriptionGate.tsx # Feature gate wrapper
│   └── SettingsTab/sections/
│       └── AccountSection.tsx   # Account & subscription settings

supabase/
├── functions/
│   ├── create-checkout-session/index.ts
│   ├── stripe-webhook/index.ts
│   └── create-portal-session/index.ts
└── migrations/
    └── 001_subscription_tables.sql
```
