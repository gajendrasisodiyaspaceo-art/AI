import { memo, useState, useCallback } from 'react'
import { Button, Card } from '../../common'
import type { UserSubscription } from '../../../types'

interface AccountSectionProps {
  email: string
  subscription: UserSubscription
  isPro: boolean
  error?: string | null
  onUpgrade: () => Promise<void>
  onManageSubscription: () => Promise<void>
  onLogout: () => Promise<void>
}

export default memo(function AccountSection({
  email,
  subscription,
  isPro,
  error,
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

        {isPro && subscription.currentPeriodEnd && (
          <p className="text-xs text-white/30">
            {subscription.cancelAtPeriodEnd
              ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
            }
          </p>
        )}

        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}

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
