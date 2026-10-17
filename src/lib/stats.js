import { dayKey } from './format'

export const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v))
export const isClosed = (t) => t.status === 'closed'
export const isOpen = (t) => t.status === 'open'

export const sum = (list, pick) => list.reduce((a, x) => a + (num(pick(x)) || 0), 0)

export function closedByDay(trades) {
  const map = new Map()
  for (const t of trades) {
    if (!isClosed(t) || !t.closed_at) continue
    const k = dayKey(t.closed_at)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(t)
  }
  return map
}

export function dayTotals(list) {
  return {
    usd: sum(list, (t) => t.result_usd),
    r: sum(list, (t) => t.r_multiple),
    count: list.length,
    wins: list.filter((t) => num(t.result_usd) > 0).length,
  }
}

// Equity curve points {t, v}. mode 'usd' uses balance snapshots, 'r' the running total of R.
export function equityPoints(mode, equity, trades, sinceMs) {
  if (mode === 'r') {
    const closed = trades.filter((t) => isClosed(t) && t.closed_at).sort((a, b) => new Date(a.closed_at) - new Date(b.closed_at))
    let run = 0
    const pts = closed.map((t) => ({ t: new Date(t.closed_at).getTime(), v: (run += num(t.r_multiple) || 0) }))
    const out = pts.filter((p) => !sinceMs || p.t >= sinceMs)
    if (out.length && pts.length) {
      const base = out[0] === pts[0] ? 0 : pts[pts.indexOf(out[0]) - 1].v
      out.unshift({ t: out[0].t - 1, v: base })
    }
    return out
  }
  const pts = equity
    .map((e) => ({ t: new Date(e.taken_at).getTime(), v: (num(e.balance) || 0) + (num(e.unrealized) || 0) }))
    .filter((p) => !sinceMs || p.t >= sinceMs)
  return downsample(pts, 320)
}

function downsample(points, max) {
  if (points.length <= max) return points
  const step = (points.length - 1) / (max - 1)
  const out = []
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)])
  return out
}

export function heartbeatState(beat, maxMinutes) {
  if (!beat) return { tone: 'muted', label: 'no data yet' }
  const minutes = (Date.now() - new Date(beat.last_run_at).getTime()) / 60000
  if (beat.status === 'error') return { tone: 'loss', label: 'last run failed' }
  if (minutes > maxMinutes * 2) return { tone: 'loss', label: 'late' }
  if (minutes > maxMinutes) return { tone: 'warn', label: 'slow' }
  return { tone: 'profit', label: 'on time' }
}

// Win/loss summary for a list of closed trades.
export function performance(closed) {
  const n = closed.length
  const wins = closed.filter((t) => num(t.result_usd) > 0)
  const losses = closed.filter((t) => num(t.result_usd) < 0)
  const grossWin = sum(wins, (t) => t.result_usd)
  const grossLoss = Math.abs(sum(losses, (t) => t.result_usd))
  const total = sum(closed, (t) => t.result_usd)
  const totalR = sum(closed, (t) => t.r_multiple)
  return {
    n,
    wins: wins.length,
    losses: losses.length,
    winRate: n ? (wins.length / n) * 100 : null,
    total,
    totalR,
    avgR: n ? totalR / n : null,
    avgWin: wins.length ? grossWin / wins.length : null,
    avgLoss: losses.length ? -grossLoss / losses.length : null,
    profitFactor: grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : null,
    best: n ? Math.max(...closed.map((t) => num(t.result_usd) || 0)) : null,
    worst: n ? Math.min(...closed.map((t) => num(t.result_usd) || 0)) : null,
  }
}

export function maxDrawdown(closed) {
  const sorted = [...closed].sort((a, b) => new Date(a.closed_at) - new Date(b.closed_at))
  let run = 0, peak = 0, worst = 0
  for (const t of sorted) {
    run += num(t.result_usd) || 0
    peak = Math.max(peak, run)
    worst = Math.min(worst, run - peak)
  }
  return worst
}

export function groupPerformance(closed, keyFn) {
  const groups = new Map()
  for (const t of closed) {
    const k = keyFn(t) || 'Unknown'
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(t)
  }
  return [...groups.entries()]
    .map(([name, list]) => ({ name, ...performance(list) }))
    .sort((a, b) => b.total - a.total)
}
