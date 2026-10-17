import { useEffect, useMemo, useState } from 'react'
import { useData } from '../data'
import { api } from '../lib/api'
import { PAIRS, STRATEGIES } from '../lib/nav'
import { Card, Notice, PageHead, Stepper, Switch, useToast } from '../ui'
import { StatusPill, TradingSwitchConfirm, useTradingSwitch } from '../controls'
import { dateTime, money } from '../lib/format'

const FIELDS = ['max_concurrent_trades', 'risk_percent', 'max_position_notional_usd', 'max_hold_hours', 'enabled_strategies', 'enabled_pairs']
const same = (a, b) => JSON.stringify(Array.isArray(a) ? [...a].sort() : a) === JSON.stringify(Array.isArray(b) ? [...b].sort() : b)

const LABELS = {
  trading_enabled: 'Trading', max_concurrent_trades: 'Max open trades', risk_percent: 'Risk per trade',
  max_position_notional_usd: 'Max position size', max_hold_hours: 'Time stop', enabled_strategies: 'Strategies', enabled_pairs: 'Pairs',
  leverage: 'Leverage', margin_mode: 'Margin mode',
}

export default function Settings() {
  const { settings, history, refresh, loading } = useData()
  const { enabled } = useTradingSwitch()
  const toast = useToast()
  const [draft, setDraft] = useState(null)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState(false)

  // Load the saved values into the form once, and again after a successful save.
  useEffect(() => {
    if (settings && !draft) setDraft(Object.fromEntries(FIELDS.map((k) => [k, Array.isArray(settings[k]) ? [...settings[k]] : Number(settings[k]) ])))
  }, [settings, draft])

  const changed = useMemo(() => {
    if (!settings || !draft) return {}
    const out = {}
    FIELDS.forEach((k) => {
      const saved = Array.isArray(settings[k]) ? settings[k] : Number(settings[k])
      if (!same(draft[k], saved)) out[k] = draft[k]
    })
    return out
  }, [settings, draft])
  const dirty = Object.keys(changed).length > 0

  if (!settings || !draft) {
    return (
      <>
        <PageHead title="Settings" />
        <Card><div className="empty">{loading ? 'Loading…' : 'No settings row found in Supabase yet. It is created the first time the bot runs after Phase 2.'}</div></Card>
      </>
    )
  }

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const toggle = (k, name) => {
    const list = draft[k]
    set(k, list.includes(name) ? list.filter((x) => x !== name) : [...list, name])
  }

  async function save() {
    setSaving(true)
    try {
      await api('/api/settings', { method: 'POST', body: changed })
      setDraft(null)
      await refresh()
      toast('Settings saved. The bot uses them from the next signal, no redeploy needed.')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const noStrategy = draft.enabled_strategies.length === 0
  const noPair = draft.enabled_pairs.length === 0

  return (
    <>
      <PageHead title="Settings" sub="Changes apply from the next signal. No redeploy needed.">
        <StatusPill />
      </PageHead>

      <section className="settings-grid">
        <div className="stack">
          <Card title="Trading switch">
            <div className="setting-row" style={{ borderTop: 0, paddingTop: 0 }}>
              <div className="info">
                <div className="name">{enabled ? 'Trading is on' : 'Trading is paused'}</div>
                <div className="hint">Pausing stops new trades. Open trades keep their stop-loss and exit orders. Telegram /stop and /start use the same switch.</div>
              </div>
              <Switch big on={Boolean(enabled)} label="Trading on or off" onChange={() => setConfirm(true)} />
            </div>
          </Card>

          <Card title="Risk and sizing">
            <div className="setting-row" style={{ borderTop: 0, paddingTop: 0 }}>
              <div className="info"><div className="name">Max open trades</div><div className="hint">Signals beyond this are logged as rejected.</div></div>
              <Stepper value={draft.max_concurrent_trades} min={1} max={10} onChange={(v) => set('max_concurrent_trades', v)} changed={'max_concurrent_trades' in changed} />
            </div>
            <div className="setting-row">
              <div className="info"><div className="name">Risk per trade</div><div className="hint">Percent of balance risked if the stop is hit. Maximum 10%.</div></div>
              <Stepper value={draft.risk_percent} min={0.5} max={10} step={0.5} format={(v) => `${v}%`} onChange={(v) => set('risk_percent', v)} changed={'risk_percent' in changed} />
            </div>
            <div className="setting-row">
              <div className="info"><div className="name">Max position size</div><div className="hint">Largest notional value of one trade.</div></div>
              <Stepper value={draft.max_position_notional_usd} min={1000} max={100000} step={1000} format={(v) => money(v, { dec: 0 })} onChange={(v) => set('max_position_notional_usd', v)} changed={'max_position_notional_usd' in changed} />
            </div>
            <div className="setting-row">
              <div className="info"><div className="name">Time stop</div><div className="hint">Close a trade that is still open after this many hours.</div></div>
              <Stepper value={draft.max_hold_hours} min={1} max={168} format={(v) => `${v}h`} onChange={(v) => set('max_hold_hours', v)} changed={'max_hold_hours' in changed} />
            </div>
            <div className="setting-row">
              <div className="info"><div className="name">Leverage and margin</div><div className="hint">Fixed by the server for safety.</div></div>
              <span className="mono soft">{settings.leverage}x · {settings.margin_mode}</span>
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card title="Strategies">
            {STRATEGIES.map((s, i) => (
              <div className="setting-row" key={s.name} style={i === 0 ? { borderTop: 0, paddingTop: 0 } : undefined}>
                <div className="info"><div className="name">{s.name}</div><div className="hint">{s.hint}</div></div>
                <Switch on={draft.enabled_strategies.includes(s.name)} label={s.name} onChange={() => toggle('enabled_strategies', s.name)} />
              </div>
            ))}
            {noStrategy ? <Notice tone="warn">Every strategy is off, so the bot will reject all signals.</Notice> : null}
          </Card>

          <Card title="Pairs">
            <div className="chips">
              {PAIRS.map((p) => {
                const on = draft.enabled_pairs.includes(p)
                return (
                  <button key={p} type="button" className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => toggle('enabled_pairs', p)}>
                    <span className="dot" />{p.replace('USDT', '')}
                  </button>
                )
              })}
            </div>
            {noPair ? <Notice tone="warn">Every pair is off, so the bot will reject all signals.</Notice> : null}
            <div className="muted" style={{ fontSize: 12 }}>
              These ten pairs are the ones the strategy has been backtested on. A new pair needs a backtest first, so adding pairs is not offered yet.
            </div>
            <button type="button" className="btn" disabled>Add pair (needs backtest)</button>
          </Card>
        </div>
      </section>

      <div className="card" style={{ position: 'sticky', bottom: 'calc(var(--tabbar-h, 0px) + 12px)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, zIndex: 5 }}>
        <span className="soft">{dirty ? `${Object.keys(changed).length} unsaved change${Object.keys(changed).length > 1 ? 's' : ''}` : 'No unsaved changes'}</span>
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" className="btn" disabled={!dirty || saving} onClick={() => setDraft(null)}>Discard</button>
          <button type="button" className="btn primary" disabled={!dirty || saving} onClick={save}>{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>

      <Card title="Change history">
        {history.length === 0 ? <div className="empty">No changes recorded yet.</div> : history.slice(0, 20).map((h) => (
          <div className="row" key={h.id}>
            <span className="mono muted" style={{ minWidth: 104 }}>{dateTime(h.changed_at)}</span>
            <b style={{ flex: '0 0 150px' }}>{LABELS[h.setting] || h.setting}</b>
            <span className="soft mono" style={{ flex: '1 1 220px', overflowWrap: 'anywhere', fontSize: 13 }}>{h.old_value ?? '—'} → {h.new_value ?? '—'}</span>
            <span className="tag muted">{h.source}</span>
          </div>
        ))}
      </Card>

      {confirm ? <TradingSwitchConfirm turnOn={!enabled} onClose={() => setConfirm(false)} /> : null}
    </>
  )
}
