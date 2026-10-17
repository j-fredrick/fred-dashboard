import { useMemo, useState } from 'react'
import { money, moneyCompact, rText, price, tone, dateShort, dateTime, timeHM, REASONS, SIDE_TONE } from './lib/format'
import { num } from './lib/stats'

// Where price sits between the stop (0%) and the target (100%).
export function progress(mark, stop, target) {
  const m = num(mark), s = num(stop), t = num(target)
  if (m === null || s === null || t === null || t === s) return null
  return Math.max(0, Math.min(100, ((m - s) / (t - s)) * 100))
}

export function exitNote(mode, pct) {
  if (mode === 'trailing') return pct !== null && pct >= 100 ? 'trail level reached' : 'trail not active yet'
  if (mode === 'limit') return 'target is a limit order'
  if (mode === 'market_tp') return 'target is a market order'
  return 'exit order set'
}

export function OpenTradeMini({ trade, pos }) {
  const pnl = pos ? pos.pnl_usd : null
  const pct = pos ? progress(pos.mark, trade.stop_price, trade.target_price) : null
  const color = tone(pnl) === 'muted' ? 'var(--muted)' : `var(--${tone(pnl)})`
  return (
    <div className="inner" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <b>{trade.symbol}</b>
          <span className={`side ${SIDE_TONE[trade.side]}`}>{trade.side}</span>
        </div>
        <span className={`mono ${tone(pnl)}`} style={{ fontWeight: 600 }}>{pnl === null ? '—' : money(pnl, { sign: true })}</span>
      </div>
      <div className="muted" style={{ fontSize: 12 }}>{trade.strategy} · {exitNote(trade.exit_mode, pct)}</div>
      <div className="bar"><i style={{ width: `${pct ?? 0}%`, background: color }} /></div>
      <div className="mono" style={{ display: 'flex', justifyContent: 'space-between', color: '#7C8A9C', fontSize: 11 }}>
        <span>stop {price(trade.stop_price)}</span><span>target {price(trade.target_price)}</span>
      </div>
    </div>
  )
}

export function SignalRow({ s, compact = false }) {
  const t = s.outcome === 'traded' ? 'profit' : s.outcome === 'error' ? 'loss' : 'warn'
  const label = s.outcome === 'traded' ? 'Traded' : s.outcome === 'error' ? 'Error' : 'Rejected'
  const reason = s.outcome === 'traded'
    ? [s.entry ? `Signal at ${price(s.entry)}` : null].filter(Boolean).join(' · ') || 'Order placed'
    : s.reason_text || REASONS[s.reason_code] || '—'
  return (
    <div className="row" style={{ alignItems: 'center' }}>
      <span className="mono muted" style={{ flex: '0 0 auto', minWidth: compact ? 56 : 104 }}>{compact ? timeHM(s.created_at) : dateTime(s.created_at)}</span>
      <b style={{ flex: '0 0 96px' }}>{s.symbol}</b>
      <span className="soft" style={{ flex: '1 1 200px' }}>{s.strategy || '—'}{s.grade ? ` · grade ${s.grade}` : ''}</span>
      <span className={`tag ${t}`}>{label}</span>
      <span className="muted" style={{ flex: '1 1 220px', fontSize: 13 }}>{reason}</span>
    </div>
  )
}

// Equity / R curve with a hover read-out. Time-based x axis, drawn as plain SVG.
export function EquityChart({ points, mode }) {
  const [hover, setHover] = useState(null)
  const W = 640, H = 240

  const geo = useMemo(() => {
    if (points.length < 2) return null
    const t0 = points[0].t, t1 = points[points.length - 1].t
    const vals = points.map((p) => p.v)
    let lo = Math.min(...vals), hi = Math.max(...vals)
    const pad = Math.max((hi - lo) * 0.08, mode === 'r' ? 0.2 : 5)
    lo -= pad; hi += pad
    const x = (t) => (t1 === t0 ? 0 : ((t - t0) / (t1 - t0)) * W)
    const y = (v) => H - 4 - ((v - lo) / (hi - lo)) * (H - 8)
    const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.t).toFixed(1)} ${y(p.v).toFixed(1)}`).join(' ')
    return { t0, t1, lo, hi, x, y, line, area: `${line} L${W} ${H} L0 ${H} Z` }
  }, [points, mode])

  if (!geo) {
    return <div className="empty">The curve appears after the bot has saved a few balance snapshots (one every 5 minutes).</div>
  }

  const fmt = (v) => (mode === 'r' ? `${v.toFixed(1)}R` : moneyCompact(v))
  const mid = (geo.lo + geo.hi) / 2

  function onMove(e) {
    const rect = e.currentTarget.getBoundingClientRect()
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
    const t = geo.t0 + frac * (geo.t1 - geo.t0)
    let best = 0
    for (let i = 1; i < points.length; i++) if (Math.abs(points[i].t - t) < Math.abs(points[best].t - t)) best = i
    setHover(best)
  }

  const hp = hover !== null ? points[hover] : null
  return (
    <div>
      <div className="chart">
        <div className="yaxis"><span>{fmt(geo.hi)}</span><span>{fmt(mid)}</span><span>{fmt(geo.lo)}</span></div>
        <div className="plot" onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img"
            aria-label={`${mode === 'r' ? 'R' : 'Equity'} curve from ${dateShort(geo.t0)} to ${dateShort(geo.t1)}`}>
            {[0, H / 2, H - 1].map((yy) => <line key={yy} x1="0" y1={yy} x2={W} y2={yy} stroke="#22262C" vectorEffect="non-scaling-stroke" />)}
            <path d={geo.area} fill="rgba(124,156,255,.14)" />
            <path d={geo.line} fill="none" stroke="#7C9CFF" strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
          {hp ? (
            <>
              <div className="hoverline" style={{ left: `${(geo.x(hp.t) / W) * 100}%` }} />
              <div className="hoverdot" style={{ left: `${(geo.x(hp.t) / W) * 100}%`, top: `${(geo.y(hp.v) / H) * 100}%` }} />
              <div className="tip" style={{ left: `${Math.min(88, Math.max(12, (geo.x(hp.t) / W) * 100))}%` }}>
                {mode === 'r' ? rText(hp.v) : money(hp.v)} · {dateTime(hp.t)}
              </div>
            </>
          ) : null}
        </div>
      </div>
      <div className="xaxis" style={{ marginTop: 8 }}>
        <span>{dateShort(geo.t0)}</span><span>{dateShort((geo.t0 + geo.t1) / 2)}</span><span>{dateShort(geo.t1)}</span>
      </div>
    </div>
  )
}
