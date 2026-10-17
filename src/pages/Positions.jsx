import { useState } from 'react'
import { useData } from '../data'
import { api } from '../lib/api'
import { Card, Confirm, Icon, Notice, PageHead, Pill, CHECK_ICON, useToast } from '../ui'
import { exitNote, progress } from '../components'
import { ago, holdText, money, price, rText, tone, SIDE_TONE } from '../lib/format'
import { isOpen, num } from '../lib/stats'

const targetLabel = (mode) =>
  mode === 'trailing' ? 'Trail activates at (3:1 level)' : mode === 'limit' ? 'Take-profit (limit order)' : 'Take-profit (market order)'
const exitChip = (mode) =>
  mode === 'trailing' ? 'Trailing order armed' : mode === 'limit' ? 'Limit target resting' : 'Take-profit order set'

export default function Positions() {
  const { live, trades, settings, refreshLive, refresh } = useData()
  const toast = useToast()
  const [confirm, setConfirm] = useState(null)
  const [busy, setBusy] = useState(false)

  const open = trades.filter(isOpen)
  const tradeFor = (symbol) => open.filter((t) => t.symbol === symbol).sort((a, b) => new Date(b.opened_at) - new Date(a.opened_at))[0]
  const positions = live.positions || []
  const untracked = positions.filter((p) => !p.tracked)
  const maxTrades = settings?.max_concurrent_trades ?? '?'

  async function closePair(symbol) {
    setBusy(true)
    try {
      await api('/api/close', { method: 'POST', body: { symbol } })
      toast(`${symbol} closed at market. The result is recorded on the next trade check.`)
      setConfirm(null)
      await Promise.all([refreshLive(), refresh()])
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHead title="Live positions" sub={`${positions.length} of ${maxTrades} slots used · ${live.at ? `checked with Binance ${ago(live.at)}` : 'checking…'}`}>
        {live.positions ? (untracked.length
          ? <Pill tone="warn">{untracked.length} position{untracked.length > 1 ? 's' : ''} not tracked by the bot</Pill>
          : positions.length ? <Pill tone="profit">Every position has a stop level on record</Pill> : null) : null}
        <button type="button" className="btn small" onClick={refreshLive}>Refresh</button>
      </PageHead>

      {live.error ? <Notice tone="error">Could not load live positions: {live.error}</Notice> : null}
      {untracked.length ? (
        <Notice tone="warn">
          {untracked.map((p) => p.symbol).join(', ')} {untracked.length > 1 ? 'are' : 'is'} open on Binance but the bot has no record of {untracked.length > 1 ? 'them' : 'it'}.
          Check {untracked.length > 1 ? 'their' : 'its'} stop order on Binance directly.
        </Notice>
      ) : null}

      {live.positions && positions.length === 0 ? <Card><div className="empty">No open positions. New trades appear here as soon as they open.</div></Card> : null}

      <section className="auto-grid">
        {positions.map((p) => {
          const t = tradeFor(p.symbol)
          const mode = p.exit_mode || t?.exit_mode
          const stop = p.stop ?? t?.stop_price
          const target = p.target ?? t?.target_price
          const pct = progress(p.mark, stop, target)
          const risk = num(t?.risk_amount)
          const r = risk ? p.pnl_usd / risk : null
          const heldPct = p.hours_open != null && p.max_hold_hours ? Math.min(100, (p.hours_open / p.max_hold_hours) * 100) : 0
          const left = p.hours_open != null && p.max_hold_hours ? Math.max(0, p.max_hold_hours - p.hours_open) : null
          const color = `var(--${tone(p.pnl_usd) === 'muted' ? 'muted' : tone(p.pnl_usd)})`
          return (
            <article key={p.symbol} className="card" style={{ gap: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ fontSize: 18, fontWeight: 700 }}>{p.symbol}</span>
                    <span className={`side ${SIDE_TONE[p.side]}`}>{p.side === 'LONG' ? 'BUY' : 'SELL'}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 13, marginTop: 3 }}>
                    {p.strategy || t?.strategy || 'Not tracked'}{t?.grade ? ` · grade ${t.grade}` : ''}{t?.session ? ` · ${t.session}` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className={`mono ${tone(p.pnl_usd)}`} style={{ fontSize: 22, fontWeight: 600 }}>{money(p.pnl_usd, { sign: true })}</div>
                  <div className={`mono ${tone(p.pnl_usd)}`} style={{ fontSize: 13 }}>{r === null ? '' : rText(r)}</div>
                </div>
              </div>

              <div className="kv">
                <div className="inner"><div className="k">Entry (real fill)</div><div className="v">{price(p.entry)}</div></div>
                <div className="inner"><div className="k">Current price</div><div className="v">{price(p.mark)}</div></div>
              </div>

              {stop != null && target != null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 8 }}>
                    <span className="muted">Stop-loss <span style={{ color: '#6F7C8D' }}>(market, mark price)</span></span>
                    <span className="mono"><span>{price(stop)}</span> <span style={{ color: 'var(--loss-soft)' }}>{p.stop_distance_pct != null ? `${p.stop_distance_pct}% away` : ''}</span></span>
                  </div>
                  <div className="bar tall">
                    <i style={{ width: `${pct ?? 0}%`, background: color }} />
                    {pct !== null ? <span className="marker" style={{ left: `${pct}%` }} /> : null}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, gap: 8 }}>
                    <span className="muted">{targetLabel(mode)}</span>
                    <span className="mono"><span>{price(target)}</span> <span className="profit">{p.target_distance_pct != null ? `${p.target_distance_pct}% away` : ''}</span></span>
                  </div>
                </div>
              ) : <Notice tone="warn">No stop or target on record for this position.</Notice>}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span className="pill profit" style={{ fontSize: 12, padding: '5px 10px', fontWeight: 500 }}><Icon d={CHECK_ICON} size={13} stroke={2.4} />Stop level recorded</span>
                {mode ? <span className="pill profit" style={{ fontSize: 12, padding: '5px 10px', fontWeight: 500 }}><Icon d={CHECK_ICON} size={13} stroke={2.4} />{exitChip(mode)}</span> : null}
                <span className="muted" style={{ fontSize: 12, alignSelf: 'center' }}>{exitNote(mode, pct)}</span>
              </div>

              {p.hours_open != null ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="muted" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span>Held {holdText(p.hours_open)}</span><span>Time stop in {holdText(left)}</span>
                  </div>
                  <div className="bar" style={{ height: 5 }}><i style={{ width: `${heldPct}%`, background: 'var(--accent)', opacity: 1 }} /></div>
                </div>
              ) : null}

              <button type="button" className="btn ghost-danger" onClick={() => setConfirm({ p, r })}>Close {p.symbol}</button>
            </article>
          )
        })}
      </section>

      <Notice>
        You can close one pair at a time. There is no close-all button on purpose. If a stop order is ever missing or rejected,
        a red problem banner appears at the top of every page and a Telegram alert is sent.
      </Notice>

      {confirm ? (
        <Confirm title={`Close ${confirm.p.symbol}?`} confirmLabel="Close position" busy={busy}
          onCancel={() => setConfirm(null)} onConfirm={() => closePair(confirm.p.symbol)}>
          Close <b>{confirm.p.symbol}</b> at market now? You will lock in{' '}
          <b className={`mono ${tone(confirm.p.pnl_usd)}`}>{money(confirm.p.pnl_usd, { sign: true })}</b>.
          Its leftover stop and exit orders are cancelled by the next trade check.
        </Confirm>
      ) : null}
    </>
  )
}
