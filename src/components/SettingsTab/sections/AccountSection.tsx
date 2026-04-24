import { memo, useState, useCallback } from 'react'
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Section label */}
      <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', paddingLeft: '2px' }}>
        Account
      </p>

      {/* Card container */}
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: '12px',
        border: '1px solid var(--border-glass)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}>
        {/* Email row with Pro badge */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{email}</p>
            {isPro && (
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(135deg, #8B5CF6, #6D28D9)',
                padding: '2px 8px',
                borderRadius: '6px',
                letterSpacing: '0.02em',
                lineHeight: '16px',
              }}>
                PRO
              </span>
            )}
            {!isPro && subscription.plan === 'free' && (
              <span style={{
                fontSize: '10px',
                fontWeight: 500,
                color: 'var(--text-muted)',
                background: 'var(--bg-surface)',
                padding: '2px 8px',
                borderRadius: '6px',
                border: '1px solid var(--border-glass)',
                lineHeight: '16px',
              }}>
                Free
              </span>
            )}
          </div>
          {/* Subscription status info */}
          {isPro && subscription.currentPeriodEnd && (
            <p style={{ fontSize: '11px', color: subscription.cancelAtPeriodEnd ? '#F59E0B' : 'var(--text-muted)', lineHeight: '1.4' }}>
              {subscription.cancelAtPeriodEnd
                ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
              }
            </p>
          )}
          {!isPro && subscription.status === 'expired' && (
            <p style={{ fontSize: '11px', color: '#F59E0B', lineHeight: '1.4' }}>
              Subscription expired
            </p>
          )}
          {!isPro && subscription.status === 'canceled' && (
            <p style={{ fontSize: '11px', color: '#F59E0B', lineHeight: '1.4' }}>
              Subscription canceled
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            fontSize: '12px',
            color: '#f87171',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.15)',
            borderRadius: '8px',
            padding: '8px 12px',
          }}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Primary action: Upgrade / Manage */}
          {isPro ? (
            <button
              onClick={onManageSubscription}
              className="active:scale-[0.98]"
              style={{
                height: '40px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 500,
                color: 'var(--text-secondary)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-glass)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2A2A2E'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
            >
              Manage Subscription
            </button>
          ) : (
            <button
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="active:scale-[0.98]"
              style={{
                height: '40px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 600,
                color: '#fff',
                background: 'linear-gradient(180deg, #9061F9, #7C3AED)',
                border: 'none',
                cursor: upgradeLoading ? 'not-allowed' : 'pointer',
                opacity: upgradeLoading ? 0.5 : 1,
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.25), 0 1px 2px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => { if (!upgradeLoading) e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.35), 0 1px 3px rgba(0, 0, 0, 0.3)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.25), 0 1px 2px rgba(0, 0, 0, 0.2)' }}
            >
              {upgradeLoading ? 'Loading...' : 'Upgrade to Pro'}
            </button>
          )}

          {/* Secondary action: Logout */}
          <button
            onClick={onLogout}
            className="active:scale-[0.98]"
            style={{
              height: '40px',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 500,
              color: 'rgba(239, 68, 68, 0.7)',
              background: 'rgba(239, 68, 68, 0.06)',
              border: '1px solid rgba(239, 68, 68, 0.12)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)'; e.currentTarget.style.color = '#f87171' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.06)'; e.currentTarget.style.color = 'rgba(239, 68, 68, 0.7)' }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
})
