import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useData } from '../data'
import { TradingSwitchConfirm, StatusPill, useTradingSwitch } from '../controls'
import { Card, PageHead, Segmented, Stat } from '../ui'
import { EquityChart, OpenTradeMini, SignalRow } from '../components'
import { money, pct, ago, longDate, dayKey, tone } from '../lib/format'
import { closedByDay, dayTotals, equityPoints, heartbeatState, isClosed, isOpen, num, sum } from '../lib/stats'

const RANGES = [{ value: '7', label: '7D' }, { value: '30', label: '30D' }, { value: 'all', label: 'All' }]

export default function Overview() {
  const { trades, signals, equity, beats, settings, live, loading } = useData()
  const { enabled } = useTradingSwitch()
  const [mode, setMode] = useState('usd')
  const [range, setRange] = useState('30')
  const [confirm, setConfirm] = useState(false)

  const open = useMemo(() => trades.filter(isOpen), [trades])
  const closed = useMemo(() => trades.filter(isClosed), [trades])
  const byDay = useMemo(() => closedByDay(trades), [trades])
  const today = dayTotals(byDay.get(dayKey(Date.now())) || [])
  const totalPnl = sum(closed, (t) => t.result_usd)
  const latest = equity.length ? equity[equity.length - 1] : null
  const first = equity.length ? equity[0] : null
  const balance = latest ? num(latest.balance) : null
  const unrealized = live.positions ? sum(live.positions, (p) => p.pnl_usd) : latest ? num(latest.unrealized) : null
  const openRisk = sum(open, (t) => t.risk_amount)
  const maxTrades = settings?.max_concurrent_trades ?? '?'
  const sinceMs = range === 'all' ? null : Date.now() - Number(range) * 86400000
  const points = useMemo(() => equityPoints(mode, equity, trades, sinceMs), [mode, equity, trades, range]) // eslint-disable-line

  const posBySymbol = Object.fromEntries((live.positions || []).map((p) => [p.symbol, p]))
  const week = signals.filter((s) => Date.now() - new Date(s.created_at).getTime() < 7 * 86400000)
  const weekTraded = week.filter((s) => s.outcome === 'traded').length
  const weekRejected = week.filter((s) => s.outcome === 'rejected')
  const topReason = (() => {
    const counts = {}
    weekRejected.forEach((s) => { counts[s.reason_code || 'OTHER'] = (counts[s.reason_code || 'OTHER'] || 0) + 1 })
    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    return best ? best : null
  })()

  const beat = (job) => beats.find((b) => b.job === job)
  const chips = [
    { label: 'Signal check', b: beat('run-checks'), max: 65 },
    { label: 'Trade check', b: beat('manage-trades'), max: 10 },
  ]

  return (
    <>
      <PageHead title="Overview" sub={`${longDate()} · Lagos time`}>
        <span className="hide-mobile"><StatusPill /></span>
        <button type="button" className="btn" disabled={enabled === null} onClick={() => setConfirm(true)}>
          {enabled === false ? 'Resume trading' : 'Pause trading'}
        </button>
      </PageHead>

      <section className="beats" aria-label="System heartbeat">
        {chips.map(({ label, b, max }) => {
          const s = heartbeatState(b, max)
          return (
            <div className="beat" key={label}>
              <span className={`dot ${s.tone}`} />
              <span>{label}</span>
              <span className="mono" style={{ color: 'var(--text)' }}>{b ? ago(b.last_run_at) : s.label}</span>
            </div>
          )
        })}
        <div className="beat"><span className={`dot ${live.error ? 'warn' : live.positions ? 'profit' : 'muted'}`} /><span>Binance</span>
          <span className="mono" style={{ color: 'var(--text)' }}>{live.error ? 'unreachable' : live.positions ? 'connected' : 'checking'}</span></div>
      </section>

      <section className="grid-stats" aria-label="Account">
        <Stat label="Balance" value={balance === null ? '—' : money(balance)}
          sub={balance === null ? (loading ? 'Loading…' : 'Waiting for first snapshot') : `Equity ${money(balance + (unrealized || 0))} with open P&L`} />
        <Stat label="Today's P&L" value={money(today.usd, { sign: true })} tone={tone(today.usd)}
          sub={`${today.count} trade${today.count === 1 ? '' : 's'} closed`} />
        <Stat label="Total P&L" value={money(totalPnl, { sign: true })} tone={tone(totalPnl)}
          sub={first && num(first.balance) ? `${pct((totalPnl / num(first.balance)) * 100, { sign: true })} of starting balance` : `${closed.length} closed trades`} />
        <Stat label="Open risk" value={money(openRisk, { dec: 0 })} tone={openRisk ? 'warn' : ''}
          sub={`${open.length} trade${open.length === 1 ? '' : 's'}${balance ? ` · ${pct((openRisk / balance) * 100)} of balance` : ''}`} />
      </section>

      <section className="two-col">
        <Card className="wide" title="Equity curve" right={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Segmented value={range} onChange={setRange} options={RANGES} />
            <Segmented value={mode} onChange={setMode} options={[{ value: 'usd', label: 'Dollars' }, { value: 'r', label: 'R' }]} />
          </div>}>
          <EquityChart points={points} mode={mode} />
        </Card>

        <Card className="narrow" title="Open trades" right={<span className="muted" style={{ fontSize: 13 }}>{open.length} of {maxTrades} slots used</span>}>
          {open.length === 0 ? <div className="empty">No open trades right now.</div> : open.map((t) => (
            <OpenTradeMini key={t.id} trade={t} pos={posBySymbol[t.symbol]} />
          ))}
          {live.error && open.length ? <div className="muted" style={{ fontSize: 12 }}>Live prices unavailable: {live.error}</div> : null}
          {open.length ? <Link to="/positions">Manage positions →</Link> : null}
        </Card>
      </section>

      <Card title="Latest signals" right={
        <span className="muted" style={{ fontSize: 13 }}>
          Last 7 days: {week.length} signals · {weekTraded} traded · {weekRejected.length} rejected
          {topReason ? ` (${topReason[1]} for ${topReason[0].toLowerCase().replace(/_/g, ' ')})` : ''}
        </span>}>
        {signals.length === 0 ? <div className="empty">No signals yet. Every hourly check that fires a signal appears here, traded or not.</div>
          : signals.slice(0, 6).map((s) => <SignalRow key={s.id} s={s} compact />)}
        {signals.length ? <Link to="/signals">All signals →</Link> : null}
      </Card>

      {confirm ? <TradingSwitchConfirm turnOn={enabled === false} onClose={() => setConfirm(false)} /> : null}
    </>
  )
}
