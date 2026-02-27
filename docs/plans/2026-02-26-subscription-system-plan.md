# InterviewAI Subscription System - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Supabase auth + Stripe subscription billing so the app gates features (screen capture, OCR, daily question limit) behind a Pro plan.

**Architecture:** Supabase handles auth (email/password) and stores user profiles, subscriptions, and daily usage in Postgres. Stripe Checkout (hosted page) handles payments. Supabase Edge Functions bridge Stripe webhooks to database updates. The Electron app checks subscription status on login and gates features accordingly.

**Tech Stack:** Supabase (auth + Postgres + Edge Functions), Stripe (Checkout + Customer Portal + Webhooks), `@supabase/supabase-js` SDK, React hooks for state management.

**Design doc:** `docs/plans/2026-02-26-subscription-system-design.md`

---

## Prerequisites (Manual Steps - Do Before Starting)

Before any code tasks, these manual setup steps must be completed:

1. **Create Supabase project** at https://supabase.com/dashboard
   - Note the `SUPABASE_URL` and `SUPABASE_ANON_KEY` from Settings > API
   - Note the `SUPABASE_SERVICE_ROLE_KEY` (for Edge Functions only)

2. **Create Stripe account** at https://dashboard.stripe.com
   - Get `STRIPE_SECRET_KEY` from Developers > API Keys
   - Create a Product: "InterviewAI Pro" with a recurring Price of $9.99/month
   - Note the `price_id` (starts with `price_`)
   - Set up Customer Portal at https://dashboard.stripe.com/test/settings/billing/portal

3. **Install Supabase CLI** (for Edge Functions):
   ```bash
   npm install -g supabase
   supabase login
   supabase init   # Run from project root
   supabase link --project-ref <your-project-ref>
   ```

---

## Task 1: Supabase Database Setup (Migration)

**Files:**
- Create: `supabase/migrations/001_subscription_tables.sql`

**Step 1: Create migration file**

```sql
-- profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- daily usage tracking
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  question_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Auto-create profile + free subscription on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);

  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (display_name only)
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own usage
CREATE POLICY "Users can read own usage"
  ON daily_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert/update their own usage (for incrementing question count)
CREATE POLICY "Users can upsert own usage"
  ON daily_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own usage"
  ON daily_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- Service role can do anything (for Edge Functions / webhooks)
-- This is handled automatically by Supabase service role key
```

**Step 2: Apply migration**

Run: `supabase db push`
Expected: Migration applied successfully, tables created.

**Step 3: Verify in Supabase dashboard**

Go to Table Editor in Supabase dashboard. Confirm `profiles`, `subscriptions`, and `daily_usage` tables exist with correct columns.

**Step 4: Commit**

```bash
git add supabase/migrations/001_subscription_tables.sql
git commit -m "feat: add subscription database schema with RLS policies"
```

---

## Task 2: Install Dependencies & Create Supabase Client

**Files:**
- Modify: `package.json` (via npm install)
- Create: `src/services/supabaseClient.ts`
- Modify: `src/types/index.ts`

**Step 1: Install @supabase/supabase-js**

Run: `npm install @supabase/supabase-js`
Expected: Package added to dependencies.

**Step 2: Create Supabase client**

Create `src/services/supabaseClient.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

**Step 3: Create `.env` file at project root**

Create `.env`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Step 4: Add `.env` to `.gitignore`**

Append to `.gitignore`:
```
.env
.env.local
```

**Step 5: Create `.env.example`**

Create `.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Step 6: Add subscription types to `src/types/index.ts`**

Add these types at the end of the file (before the `declare global` block):

```typescript
export type SubscriptionPlan = 'free' | 'pro'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'expired'

export interface UserProfile {
  id: string
  email: string
  displayName: string | null
  stripeCustomerId: string | null
}

export interface UserSubscription {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

export interface DailyUsage {
  questionCount: number
  date: string
}

export const PLAN_LIMITS = {
  free: {
    dailyQuestions: 10,
    ocrEnabled: false,
    screenCaptureEnabled: false,
  },
  pro: {
    dailyQuestions: Infinity,
    ocrEnabled: true,
    screenCaptureEnabled: true,
  },
} as const
```

**Step 7: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 8: Commit**

```bash
git add src/services/supabaseClient.ts src/types/index.ts .env.example .gitignore package.json package-lock.json
git commit -m "feat: add Supabase client SDK and subscription types"
```

---

## Task 3: Create Subscription Service

**Files:**
- Create: `src/services/subscriptionService.ts`

**Step 1: Create subscription service**

Create `src/services/subscriptionService.ts`:

```typescript
import { supabase } from './supabaseClient'
import type { UserSubscription, DailyUsage } from '../types'

export async function getSubscription(): Promise<UserSubscription> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { plan: 'free', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false }
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, cancel_at_period_end')
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    return { plan: 'free', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false }
  }

  return {
    plan: data.plan,
    status: data.status,
    currentPeriodEnd: data.current_period_end,
    cancelAtPeriodEnd: data.cancel_at_period_end,
  }
}

export async function getDailyUsage(): Promise<DailyUsage> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { questionCount: 0, date: new Date().toISOString().split('T')[0] }
  }

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('daily_usage')
    .select('question_count, date')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (error || !data) {
    return { questionCount: 0, date: today }
  }

  return { questionCount: data.question_count, date: data.date }
}

export async function incrementQuestionCount(): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const today = new Date().toISOString().split('T')[0]

  // Upsert: insert if not exists, increment if exists
  const { data: existing } = await supabase
    .from('daily_usage')
    .select('id, question_count')
    .eq('user_id', user.id)
    .eq('date', today)
    .single()

  if (existing) {
    const newCount = existing.question_count + 1
    await supabase
      .from('daily_usage')
      .update({ question_count: newCount })
      .eq('id', existing.id)
    return newCount
  }

  await supabase
    .from('daily_usage')
    .insert({ user_id: user.id, date: today, question_count: 1 })

  return 1
}

export async function createCheckoutSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (error || !data?.url) return null
  return data.url
}

export async function createPortalSession(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data, error } = await supabase.functions.invoke('create-portal-session', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  })

  if (error || !data?.url) return null
  return data.url
}
```

**Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/services/subscriptionService.ts
git commit -m "feat: add subscription service for plan checks and usage tracking"
```

---

## Task 4: Create Auth Hook (`useAuth`)

**Files:**
- Create: `src/hooks/useAuth.ts`

**Step 1: Create useAuth hook**

Create `src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../services/supabaseClient'
import type { User, AuthError } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    // Check current session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState({ user, loading: false, error: null })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({ ...prev, user: session?.user ?? null, loading: false }))
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: formatAuthError(error) }))
      return false
    }
    setState(prev => ({ ...prev, loading: false }))
    return true
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setState(prev => ({ ...prev, loading: false, error: formatAuthError(error) }))
      return false
    }
    setState(prev => ({ ...prev, loading: false }))
    return true
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ user: null, loading: false, error: null })
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    isAuthenticated: !!state.user,
    signUp,
    signIn,
    signOut,
    clearError,
  }
}

function formatAuthError(error: AuthError): string {
  switch (error.message) {
    case 'Invalid login credentials':
      return 'Invalid email or password'
    case 'User already registered':
      return 'An account with this email already exists'
    case 'Password should be at least 6 characters':
      return 'Password must be at least 6 characters'
    default:
      return error.message
  }
}
```

**Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth hook for Supabase authentication"
```

---

## Task 5: Create Subscription Hook (`useSubscription`)

**Files:**
- Create: `src/hooks/useSubscription.ts`

**Step 1: Create useSubscription hook**

Create `src/hooks/useSubscription.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { getSubscription, getDailyUsage, incrementQuestionCount, createCheckoutSession, createPortalSession } from '../services/subscriptionService'
import { PLAN_LIMITS } from '../types'
import type { UserSubscription, DailyUsage, SubscriptionPlan } from '../types'
import { shell } from '../services/electronShell'

export function useSubscription() {
  const [subscription, setSubscription] = useState<UserSubscription>({
    plan: 'free',
    status: 'active',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  })
  const [usage, setUsage] = useState<DailyUsage>({ questionCount: 0, date: '' })
  const [loading, setLoading] = useState(true)

  const plan = subscription.plan
  const limits = PLAN_LIMITS[plan]
  const questionsRemaining = limits.dailyQuestions === Infinity
    ? Infinity
    : Math.max(0, limits.dailyQuestions - usage.questionCount)
  const canAskQuestion = questionsRemaining > 0
  const canScreenCapture = limits.screenCaptureEnabled
  const canOCR = limits.ocrEnabled
  const isPro = plan === 'pro'

  const refresh = useCallback(async () => {
    setLoading(true)
    const [sub, daily] = await Promise.all([getSubscription(), getDailyUsage()])
    setSubscription(sub)
    setUsage(daily)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const trackQuestion = useCallback(async (): Promise<boolean> => {
    if (isPro) return true // Pro users always allowed

    const newCount = await incrementQuestionCount()
    setUsage(prev => ({ ...prev, questionCount: newCount }))
    return newCount <= PLAN_LIMITS.free.dailyQuestions
  }, [isPro])

  const openCheckout = useCallback(async () => {
    const url = await createCheckoutSession()
    if (url) {
      // Open in default browser
      window.electronAPI.openExternal(url)
    }
  }, [])

  const openPortal = useCallback(async () => {
    const url = await createPortalSession()
    if (url) {
      window.electronAPI.openExternal(url)
    }
  }, [])

  return {
    subscription,
    usage,
    loading,
    plan,
    isPro,
    questionsRemaining,
    canAskQuestion,
    canScreenCapture,
    canOCR,
    refresh,
    trackQuestion,
    openCheckout,
    openPortal,
  }
}
```

**Step 2: Add `openExternal` to Electron API**

This hook calls `window.electronAPI.openExternal(url)` which doesn't exist yet. We'll add it in Task 7 when we update the Electron IPC layer.

**Step 3: Verify build compiles (will have type error for openExternal - that's OK, fixed in Task 7)**

**Step 4: Commit**

```bash
git add src/hooks/useSubscription.ts
git commit -m "feat: add useSubscription hook for plan checking and usage tracking"
```

---

## Task 6: Create Auth Screen Component

**Files:**
- Create: `src/components/AuthScreen/AuthScreen.tsx`

**Step 1: Create AuthScreen component**

Create `src/components/AuthScreen/AuthScreen.tsx`:

```tsx
import { useState, useCallback } from 'react'
import { Button, Input } from '../common'

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<boolean>
  onSignUp: (email: string, password: string) => Promise<boolean>
  error: string | null
  loading: boolean
  onClearError: () => void
}

export default function AuthScreen({ onSignIn, onSignUp, error, loading, onClearError }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'login' ? 'signup' : 'login')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setLocalError(null)
    setSignupSuccess(false)
    onClearError()
  }, [onClearError])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!email.trim() || !password.trim()) {
      setLocalError('Please fill in all fields')
      return
    }

    if (mode === 'signup') {
      if (password.length < 6) {
        setLocalError('Password must be at least 6 characters')
        return
      }
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match')
        return
      }
      const success = await onSignUp(email, password)
      if (success) {
        setSignupSuccess(true)
      }
    } else {
      await onSignIn(email, password)
    }
  }, [email, password, confirmPassword, mode, onSignIn, onSignUp])

  const displayError = localError || error

  if (signupSuccess) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xs space-y-6 text-center">
          {/* Success icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/15 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white/70">Check your email</h2>
            <p className="text-xs text-white/40 mt-2">
              We sent a confirmation link to <span className="text-violet-400">{email}</span>. Click the link to activate your account.
            </p>
          </div>
          <Button variant="secondary" fullWidth onClick={toggleMode}>
            Back to Login
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full rounded-xl overflow-hidden app-shell flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-xs space-y-6">
        {/* Logo + Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-white/80">InterviewAI</h1>
            <p className="text-xs text-white/40 mt-1">
              {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoFocus
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          {mode === 'signup' && (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          )}

          {displayError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{displayError}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="gradient"
            fullWidth
            size="lg"
            disabled={loading}
          >
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Button>
        </form>

        {/* Toggle mode */}
        <p className="text-center text-xs text-white/35">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={toggleMode}
            className="text-violet-400 hover:text-violet-300 transition-colors"
          >
            {mode === 'login' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  )
}
```

**Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/AuthScreen/AuthScreen.tsx
git commit -m "feat: add AuthScreen component for login and signup"
```

---

## Task 7: Update Electron IPC Layer (Add `openExternal`)

**Files:**
- Modify: `electron/main.ts` (around line 285, after app:close handler)
- Modify: `electron/preload.ts` (add openExternal to exposed API)
- Modify: `src/types/index.ts` (add openExternal to ElectronAPI interface)

**Step 1: Add IPC handler in `electron/main.ts`**

After the `ipcMain.on('app:close', ...)` handler (around line 285), add:

```typescript
  // Open external URL in default browser
  ipcMain.handle('app:openExternal', async (_, url: string) => {
    const { shell } = require('electron')
    await shell.openExternal(url)
  })
```

Note: `shell` is already importable from electron at the top. So instead add `shell` to the import at line 1:

Change `electron/main.ts` line 1 from:
```typescript
import { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, dialog, screen, systemPreferences } from 'electron'
```
to:
```typescript
import { app, BrowserWindow, globalShortcut, ipcMain, desktopCapturer, dialog, screen, systemPreferences, shell } from 'electron'
```

Then add after `app:close` handler:
```typescript
  ipcMain.handle('app:openExternal', async (_, url: string) => {
    await shell.openExternal(url)
  })
```

**Step 2: Add to preload.ts**

In `electron/preload.ts`, add inside the `exposeInMainWorld` object:

```typescript
  // External URLs
  openExternal: (url: string) => ipcRenderer.invoke('app:openExternal', url),
```

**Step 3: Add to ElectronAPI interface in `src/types/index.ts`**

Inside the `ElectronAPI` interface, add after the `getAvailableModels` line:

```typescript
  // External URLs
  openExternal: (url: string) => Promise<void>
```

**Step 4: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 5: Commit**

```bash
git add electron/main.ts electron/preload.ts src/types/index.ts
git commit -m "feat: add openExternal IPC handler for opening URLs in browser"
```

---

## Task 8: Create Account Section for Settings Tab

**Files:**
- Create: `src/components/SettingsTab/sections/AccountSection.tsx`

**Step 1: Create AccountSection component**

Create `src/components/SettingsTab/sections/AccountSection.tsx`:

```tsx
import { memo, useState, useCallback } from 'react'
import { Button, Card } from '../../common'
import type { UserSubscription } from '../../../types'

interface AccountSectionProps {
  email: string
  subscription: UserSubscription
  isPro: boolean
  onUpgrade: () => Promise<void>
  onManageSubscription: () => Promise<void>
  onLogout: () => Promise<void>
}

export default memo(function AccountSection({
  email,
  subscription,
  isPro,
  onUpgrade,
  onManageSubscription,
  onLogout,
}: AccountSectionProps) {
  const [upgradeLoading, setUpgradeLoading] = useState(false)

  const handleUpgrade = useCallback(async () => {
    setUpgradeLoading(true)
    await onUpgrade()
    setUpgradeLoading(false)
  }, [onUpgrade])

  return (
    <Card>
      <div className="space-y-3">
        {/* Account info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-white/35 uppercase tracking-wider">Account</p>
            <p className="text-sm text-white/80 mt-1">{email}</p>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
              isPro
                ? 'bg-violet-500/15 text-violet-400'
                : 'bg-white/[0.06] text-white/40'
            }`}
          >
            {isPro ? 'Pro' : 'Free'}
          </span>
        </div>

        {/* Subscription info for Pro users */}
        {isPro && subscription.currentPeriodEnd && (
          <p className="text-xs text-white/30">
            {subscription.cancelAtPeriodEnd
              ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
            }
          </p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {isPro ? (
            <Button variant="secondary" size="sm" onClick={onManageSubscription}>
              Manage Subscription
            </Button>
          ) : (
            <Button
              variant="gradient"
              size="sm"
              onClick={handleUpgrade}
              disabled={upgradeLoading}
            >
              {upgradeLoading ? 'Loading...' : 'Upgrade to Pro'}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </div>
    </Card>
  )
})
```

**Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 3: Commit**

```bash
git add src/components/SettingsTab/sections/AccountSection.tsx
git commit -m "feat: add AccountSection component to settings tab"
```

---

## Task 9: Update App.tsx - Add Auth Gate

**Files:**
- Modify: `src/App.tsx`

**Step 1: Update App.tsx to include auth flow**

Replace the entire `src/App.tsx` with:

```tsx
import { useState, useEffect, useCallback, lazy, Suspense } from 'react'
import TitleBar from './components/TitleBar/TitleBar'
import TabBar from './components/TabBar/TabBar'
import { Spinner, ErrorBoundary } from './components/common'
import MiniMode from './components/MiniMode/MiniMode'
import AuthScreen from './components/AuthScreen/AuthScreen'
import { useAuth } from './hooks/useAuth'
import { useSubscription } from './hooks/useSubscription'

const LiveTab = lazy(() => import('./components/LiveTab/LiveTab'))
const SettingsTab = lazy(() => import('./components/SettingsTab/SettingsTab'))
const HistoryTab = lazy(() => import('./components/HistoryTab/HistoryTab'))
const SetupWizard = lazy(() => import('./components/SetupWizard/SetupWizard'))

type TabId = 'live' | 'settings' | 'history'

function TabFallback() {
  return (
    <div className="h-full flex items-center justify-center">
      <Spinner size="sm" label="Loading..." />
    </div>
  )
}

function App() {
  const { user, loading: authLoading, error: authError, isAuthenticated, signIn, signUp, signOut, clearError } = useAuth()
  const subscriptionState = useSubscription()

  const [activeTab, setActiveTab] = useState<TabId>('live')
  const [hasCompletedSetup, setHasCompletedSetup] = useState<boolean | null>(null)
  const [isMiniMode, setIsMiniMode] = useState(false)
  const [latestAnswer, setLatestAnswer] = useState('')

  useEffect(() => {
    if (!isAuthenticated) return
    const checkSetup = async () => {
      try {
        const settings = await window.electronAPI.getSettings()
        setHasCompletedSetup(settings.hasCompletedSetup)
      } catch {
        setHasCompletedSetup(false)
      }
    }
    checkSetup()
  }, [isAuthenticated])

  useEffect(() => {
    const unsubscribe = window.electronAPI.onShortcut((action: string) => {
      switch (action) {
        case 'toggle-mini':
          setIsMiniMode(prev => {
            const newVal = !prev
            window.electronAPI.setMiniMode(newVal)
            return newVal
          })
          break
      }
    })
    return () => { unsubscribe() }
  }, [])

  const handleSetupComplete = useCallback(() => {
    setHasCompletedSetup(true)
  }, [])

  const handleCopyAnswer = useCallback(() => {
    navigator.clipboard.writeText(latestAnswer)
  }, [latestAnswer])

  const handleExitMiniMode = useCallback(() => {
    setIsMiniMode(false)
    window.electronAPI.setMiniMode(false)
  }, [])

  // Auth loading state
  if (authLoading) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell flex items-center justify-center">
        <Spinner size="md" label="Loading..." />
      </div>
    )
  }

  // Not authenticated - show auth screen
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onSignIn={signIn}
        onSignUp={signUp}
        error={authError}
        loading={authLoading}
        onClearError={clearError}
      />
    )
  }

  // Checking setup status
  if (hasCompletedSetup === null) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell flex items-center justify-center">
        <Spinner size="md" label="Loading..." />
      </div>
    )
  }

  // Setup wizard
  if (!hasCompletedSetup) {
    return (
      <div className="h-full w-full rounded-xl overflow-hidden app-shell">
        <ErrorBoundary>
          <Suspense fallback={<TabFallback />}>
            <SetupWizard onComplete={handleSetupComplete} />
          </Suspense>
        </ErrorBoundary>
      </div>
    )
  }

  // Mini mode
  if (isMiniMode) {
    return (
      <MiniMode
        latestAnswer={latestAnswer}
        onCloseMiniMode={handleExitMiniMode}
        onCopy={handleCopyAnswer}
      />
    )
  }

  // Main app
  return (
    <div className="h-full w-full rounded-xl overflow-hidden app-shell flex flex-col">
      <TitleBar />
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      <ErrorBoundary>
        <div className="flex-1 overflow-hidden animate-fade-in" key={activeTab}>
          <Suspense fallback={<TabFallback />}>
            {activeTab === 'live' && (
              <LiveTab
                onLatestAnswer={setLatestAnswer}
                subscription={subscriptionState}
              />
            )}
            {activeTab === 'settings' && (
              <SettingsTab
                userEmail={user?.email || ''}
                subscription={subscriptionState}
                onLogout={signOut}
              />
            )}
            {activeTab === 'history' && <HistoryTab />}
          </Suspense>
        </div>
      </ErrorBoundary>
    </div>
  )
}

export default App
```

**Step 2: This will cause type errors in LiveTab and SettingsTab** because we're now passing new props. That's expected - we'll fix those in Tasks 10 and 11.

**Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: add auth gate and subscription state to App.tsx"
```

---

## Task 10: Update Settings Tab - Add Account Section + Logout

**Files:**
- Modify: `src/components/SettingsTab/SettingsTab.tsx`

**Step 1: Update SettingsTab to accept new props and render AccountSection**

Update `src/components/SettingsTab/SettingsTab.tsx`:

```tsx
import { useCallback } from 'react'
import { Spinner } from '../common'
import { useSettings } from './hooks/useSettings'
import AccountSection from './sections/AccountSection'
import AIStatusCard from './sections/AIStatusCard'
import AIProviderSection from './sections/AIProviderSection'
import APIKeySection from './sections/APIKeySection'
import OllamaInfoSection from './sections/OllamaInfoSection'
import AIModelSection from './sections/AIModelSection'
import AudioSection from './sections/AudioSection'
import TranscriptionSection from './sections/TranscriptionSection'
import StealthSection from './sections/StealthSection'
import OpacitySection from './sections/OpacitySection'
import ResumeSection from './sections/ResumeSection'
import ShortcutsSection from './sections/ShortcutsSection'

interface SettingsTabProps {
  userEmail: string
  subscription: {
    subscription: import('../../types').UserSubscription
    isPro: boolean
    openCheckout: () => Promise<void>
    openPortal: () => Promise<void>
  }
  onLogout: () => Promise<void>
}

export default function SettingsTab({ userEmail, subscription: sub, onLogout }: SettingsTabProps) {
  const {
    settings,
    audioDevices,
    aiStatus,
    resumePreview,
    showApiKey,
    setShowApiKey,
    models,
    provider,
    updateSetting,
    handleProviderChange,
    handleApiKeyChange,
    handleUploadResume,
    handleDeleteResume,
    handleStealthToggle,
    handleOpacityChange,
  } = useSettings()

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => updateSetting('aiModel', e.target.value),
    [updateSetting]
  )

  const handleAudioChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => updateSetting('audioDevice', e.target.value),
    [updateSetting]
  )

  const handleTranscriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) =>
      updateSetting('transcriptionEngine', e.target.value as 'webspeech' | 'whisper'),
    [updateSetting]
  )

  const toggleApiKeyVisibility = useCallback(() => setShowApiKey(prev => !prev), [setShowApiKey])

  if (!settings) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner label="Loading settings..." />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      <AccountSection
        email={userEmail}
        subscription={sub.subscription}
        isPro={sub.isPro}
        onUpgrade={sub.openCheckout}
        onManageSubscription={sub.openPortal}
        onLogout={onLogout}
      />
      <AIStatusCard aiStatus={aiStatus} provider={provider} />
      <AIProviderSection provider={provider} onChange={handleProviderChange} />

      {provider === 'groq' && (
        <APIKeySection
          apiKey={settings.groqApiKey}
          showApiKey={showApiKey}
          onChange={handleApiKeyChange}
          onToggleShow={toggleApiKeyVisibility}
        />
      )}

      {provider === 'ollama' && (
        <OllamaInfoSection models={models} aiStatus={aiStatus} />
      )}

      <AIModelSection model={settings.aiModel} models={models} onChange={handleModelChange} />
      <AudioSection device={settings.audioDevice} devices={audioDevices} onChange={handleAudioChange} />
      <TranscriptionSection engine={settings.transcriptionEngine} onChange={handleTranscriptionChange} />
      <StealthSection stealthMode={settings.stealthMode} onToggle={handleStealthToggle} />
      <OpacitySection opacity={settings.opacity} onChange={handleOpacityChange} />
      <ResumeSection resumePreview={resumePreview} onUpload={handleUploadResume} onDelete={handleDeleteResume} />
      <ShortcutsSection />
    </div>
  )
}
```

**Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: No type errors (or only LiveTab errors remaining from Task 11).

**Step 3: Commit**

```bash
git add src/components/SettingsTab/SettingsTab.tsx
git commit -m "feat: add AccountSection to SettingsTab with logout and subscription management"
```

---

## Task 11: Update Live Tab - Add Feature Gating

**Files:**
- Modify: `src/components/LiveTab/LiveTab.tsx`
- Modify: `src/components/LiveTab/hooks/useLiveChat.ts`
- Modify: `src/components/LiveTab/InputArea.tsx`
- Modify: `src/components/LiveTab/StatusBar.tsx`

This is the largest task. It involves:
1. Passing subscription state into LiveTab
2. Gating question submission behind usage limits
3. Disabling screen capture for free users
4. Showing "X/10 remaining" in StatusBar

**Step 1: Read LiveTab.tsx to understand current props**

Read `src/components/LiveTab/LiveTab.tsx` to understand how it currently renders.

**Step 2: Update LiveTab.tsx**

Update the LiveTab component to accept subscription props and pass them down. The exact changes depend on the current LiveTab code, but the key additions are:

- Accept `subscription` prop with the full subscription state
- Pass `canScreenCapture` to InputArea
- Pass `canAskQuestion` and `questionsRemaining` to InputArea and StatusBar
- Call `trackQuestion()` before each question submission in useLiveChat

**Step 3: Update useLiveChat.ts**

Add subscription gating to the `handleManualSubmit` and question processing functions.

Add parameter to `useLiveChat`:

```typescript
interface UseLiveChatOptions {
  onLatestAnswer?: (answer: string) => void
  trackQuestion?: () => Promise<boolean>
  canAskQuestion?: boolean
}
```

In `handleManualSubmit`, before creating the QAPair, add:

```typescript
if (trackQuestion) {
  const allowed = await trackQuestion()
  if (!allowed) return
}
```

Do the same in the audio question processing `useEffect` and OCR result processing `useEffect`.

**Step 4: Update InputArea.tsx**

Add props for subscription gating:

```typescript
interface InputAreaProps {
  // ... existing props
  canScreenCapture?: boolean
  canAskQuestion?: boolean
  questionsRemaining?: number
  isPro?: boolean
  onUpgrade?: () => void
}
```

- When `canScreenCapture` is false, show lock icon on screen capture button and disable it
- When `canAskQuestion` is false, show "Upgrade to Pro" instead of Ask button
- Show `questionsRemaining` counter near input when not Pro

**Step 5: Update StatusBar.tsx**

Add optional usage display:

```typescript
interface StatusBarProps {
  // ... existing props
  questionsRemaining?: number
  isPro?: boolean
}
```

When not Pro, show a pill: `"X/10 questions"` between the listening chip and AI status chip.

**Step 6: Verify the full app compiles**

Run: `npx tsc --noEmit`
Expected: No type errors.

**Step 7: Commit**

```bash
git add src/components/LiveTab/
git commit -m "feat: add subscription feature gating to LiveTab"
```

---

## Task 12: Create Supabase Edge Functions

**Files:**
- Create: `supabase/functions/create-checkout-session/index.ts`
- Create: `supabase/functions/stripe-webhook/index.ts`
- Create: `supabase/functions/create-portal-session/index.ts`

**Step 1: Create `create-checkout-session` Edge Function**

Create `supabase/functions/create-checkout-session/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const PRICE_ID = Deno.env.get('STRIPE_PRICE_ID')!
const APP_URL = Deno.env.get('APP_URL') || 'interviewai://subscription'

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: PRICE_ID, quantity: 1 }],
      mode: 'subscription',
      success_url: `${APP_URL}/success`,
      cancel_url: `${APP_URL}/cancel`,
      metadata: { supabase_user_id: user.id },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

**Step 2: Create `stripe-webhook` Edge Function**

Create `supabase/functions/stripe-webhook/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET)
  } catch (err) {
    return new Response(JSON.stringify({ error: `Webhook signature verification failed` }), { status: 400 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      if (!userId) break

      const subscriptionId = session.subscription as string
      const sub = await stripe.subscriptions.retrieve(subscriptionId)

      await supabase
        .from('subscriptions')
        .update({
          stripe_subscription_id: subscriptionId,
          plan: 'pro',
          status: 'active',
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
      break
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice
      const subscriptionId = invoice.subscription as string
      if (!subscriptionId) break

      const sub = await stripe.subscriptions.retrieve(subscriptionId)

      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', subscriptionId)
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription

      await supabase
        .from('subscriptions')
        .update({
          status: sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled',
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription

      await supabase
        .from('subscriptions')
        .update({
          plan: 'free',
          status: 'expired',
          stripe_subscription_id: null,
          cancel_at_period_end: false,
          updated_at: new Date().toISOString(),
        })
        .eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

**Step 3: Create `create-portal-session` Edge Function**

Create `supabase/functions/create-portal-session/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@13?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2023-10-16' })

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No Stripe customer found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: 'interviewai://settings',
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
```

**Step 4: Deploy Edge Functions**

Run:
```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase functions deploy create-portal-session
```

**Step 5: Set Edge Function secrets**

Run:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx
supabase secrets set STRIPE_PRICE_ID=price_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

**Step 6: Configure Stripe webhook**

In Stripe Dashboard > Developers > Webhooks:
- Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
- Events to listen for:
  - `checkout.session.completed`
  - `invoice.paid`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy the webhook signing secret to set as `STRIPE_WEBHOOK_SECRET`

**Step 7: Commit**

```bash
git add supabase/functions/
git commit -m "feat: add Supabase Edge Functions for Stripe checkout, webhooks, and portal"
```

---

## Task 13: Integration Testing & Polish

**Step 1: Run the full app in dev mode**

Run: `npm run dev`

**Step 2: Test auth flow**

- App should show AuthScreen first
- Sign up with a test email
- Check email for confirmation link (or disable email confirmation in Supabase dashboard for testing)
- Sign in with credentials
- Should proceed to Setup Wizard (if first time) or main app

**Step 3: Test free plan limits**

- Ask 10 questions → 11th should be blocked with upgrade prompt
- Screen capture button should be disabled with lock icon
- StatusBar should show "X/10 questions"

**Step 4: Test Stripe Checkout**

- Click "Upgrade to Pro" in Settings
- Should open Stripe Checkout in browser
- Use test card: `4242 4242 4242 4242`
- After payment, refresh app → subscription should be Pro
- Screen capture should now work
- Question limit should be removed

**Step 5: Test Customer Portal**

- Click "Manage Subscription" in Settings
- Should open Stripe Portal in browser
- Should be able to cancel subscription

**Step 6: Test logout**

- Click "Logout" in Settings
- Should return to AuthScreen
- Sign in again → should go directly to main app (not setup wizard)

**Step 7: Fix any issues found during testing**

**Step 8: Final commit**

```bash
git add -A
git commit -m "feat: complete subscription system integration"
```

---

## Task Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Database migration | `supabase/migrations/001_subscription_tables.sql` |
| 2 | Install deps + Supabase client + types | `supabaseClient.ts`, `types/index.ts`, `.env` |
| 3 | Subscription service | `subscriptionService.ts` |
| 4 | Auth hook | `useAuth.ts` |
| 5 | Subscription hook | `useSubscription.ts` |
| 6 | Auth screen component | `AuthScreen.tsx` |
| 7 | Electron IPC (openExternal) | `main.ts`, `preload.ts`, `types/index.ts` |
| 8 | Account settings section | `AccountSection.tsx` |
| 9 | App.tsx auth gate | `App.tsx` |
| 10 | Settings tab update | `SettingsTab.tsx` |
| 11 | Live tab feature gating | `LiveTab.tsx`, `useLiveChat.ts`, `InputArea.tsx`, `StatusBar.tsx` |
| 12 | Supabase Edge Functions | 3 Edge Functions for Stripe |
| 13 | Integration testing | Full app testing |

**Estimated new files:** 10
**Estimated modified files:** 8
**New dependency:** `@supabase/supabase-js`
