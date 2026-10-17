import { useState } from 'react'
import { api } from './lib/api'
import { useData } from './data'
import { Confirm, Pill, useToast } from './ui'

// One place that talks to /api/pause and /api/resume, shared by the Overview button and the Settings switch.
export function useTradingSwitch() {
  const { settings, refresh } = useData()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const enabled = settings ? Boolean(settings.trading_enabled) : null

  async function set(on) {
    setBusy(true)
    try {
      await api(on ? '/api/resume' : '/api/pause', { method: 'POST' })
      await refresh()
      toast(on ? 'Trading resumed. New signals will be processed.' : 'Trading paused. Open trades keep their stop orders.')
      return true
    } catch (e) {
      toast(e.message, 'error')
      return false
    } finally {
      setBusy(false)
    }
  }
  return { enabled, busy, set }
}

export function StatusPill() {
  const { enabled } = useTradingSwitch()
  if (enabled === null) return <Pill tone="muted">Checking…</Pill>
  return enabled ? <Pill tone="profit">Running</Pill> : <Pill tone="warn">Paused</Pill>
}

// Confirmation wrapper: asks first, then pauses or resumes.
export function TradingSwitchConfirm({ turnOn, onClose }) {
  const { busy, set } = useTradingSwitch()
  return (
    <Confirm
      title={turnOn ? 'Resume trading?' : 'Pause trading?'}
      confirmLabel={turnOn ? 'Resume trading' : 'Pause trading'}
      tone={turnOn ? 'primary' : 'danger'}
      busy={busy}
      onCancel={onClose}
      onConfirm={async () => { if (await set(turnOn)) onClose() }}
    >
      {turnOn
        ? 'New signals will be processed again from the next hourly check.'
        : 'No new trades will open. Trades that are already open keep their stop-loss and exit orders on Binance.'}
    </Confirm>
  )
}
