import { useMemo, useState } from 'react'
import { useData } from '../data'
import { Card, PageHead, Segmented, Stat } from '../ui'
import { dayKey, holdText, money, moneyCompact, price, rText, tone, timeHM, SIDE_TONE } from '../lib/format'
import { closedByDay, dayTotals, num } from '../lib/stats'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const pad = (n) => String(n).padStart(2, '0')

export default function Calendar() {
  const { trades } = useData()
  const todayKey = dayKey(Date.now())
  const [ty, tm] = todayKey.split('-').map(Number)
  const [year, setYear] = useState(ty)
  const [month, setMonth] = useState(tm - 1)
  const [mode, setMode] = useState('usd')
  const [selected, setSelected] = useState(null)

  const byDay = useMemo(() => closedByDay(trades), [trades])
  const first = new Date(Date.UTC(year, month, 1))
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const lead = (first.getUTCDay() + 6) % 7 // Monday first
  const keyOf = (d) => `${year}-${pad(month + 1)}-${pad(d)}`

  const cells = []
  for (let i = 0; i < lead; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const monthDays = []
  for (let d = 1; d <= daysInMonth; d++) {
    const list = byDay.get(keyOf(d))
    if (list) monthDays.push({ d, ...dayTotals(list) })
  }
  const total = monthDays.reduce((a, x) => a + x.usd, 0)
  const totalR = monthDays.reduce((a, x) => a + x.r, 0)
  const count = monthDays.reduce((a, x) => a + x.count, 0)
  const winDays = monthDays.filter((x) => x.usd > 0).length
  const best = monthDays.length ? monthDays.reduce((a, x) => (x.usd > a.usd ? x : a)) : null
  const worst = monthDays.length ? monthDays.reduce((a, x) => (x.usd < a.usd ? x : a)) : null
  const maxAbs = Math.max(1, ...monthDays.map((x) => Math.abs(mode === 'usd' ? x.usd : x.r)))

  function shift(delta) {
    const d = new Date(Date.UTC(year, month + delta, 1))
    setYear(d.getUTCFullYear()); setMonth(d.getUTCMonth()); setSelected(null)
  }

  const shade = (v) => {
    const a = 0.1 + 0.32 * Math.min(1, Math.abs(v) / maxAbs)
    return v > 0 ? `rgba(53,214,164,${a})` : v < 0 ? `rgba(255,123,107,${a})` : undefined
  }
  const dayTrades = selected ? (byDay.get(selected) || []).slice().sort((a, b) => new Date(a.closed_at) - new Date(b.closed_at)) : []
  const dayShort = (iso) => { const [, m, d] = iso.split('-'); return `${Number(d)} ${MONTHS[Number(m) - 1].slice(0, 3)}` }

  return (
    <>
      <PageHead title="Trade calendar" sub="Days are cut at midnight Lagos time, the same as your journal.">
        <Segmented value={mode} onChange={setMode} options={[{ value: 'usd', label: 'Dollars' }, { value: 'r', label: 'R' }]} />
      </PageHead>

      <section className="grid-stats">
        <Stat label="Month P&L" value={mode === 'usd' ? money(total, { sign: true }) : rText(totalR)} tone={tone(mode === 'usd' ? total : totalR)} sub={`${count} trades closed`} />
        <Stat label="Winning days" value={monthDays.length ? `${winDays} of ${monthDays.length}` : '—'} sub="Days that finished in profit" />
        <Stat label="Best day" value={best ? (mode === 'usd' ? money(best.usd, { sign: true }) : rText(best.r)) : '—'} tone={best ? tone(best.usd) : ''} sub={best ? dayShort(keyOf(best.d)) : 'No closed trades'} />
        <Stat label="Worst day" value={worst ? (mode === 'usd' ? money(worst.usd, { sign: true }) : rText(worst.r)) : '—'} tone={worst ? tone(worst.usd) : ''} sub={worst ? dayShort(keyOf(worst.d)) : 'No closed trades'} />
      </section>

      <Card title={`${MONTHS[month]} ${year}`} right={
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="icon-btn" aria-label="Previous month" onClick={() => shift(-1)}>‹</button>
          <button type="button" className="btn small" onClick={() => { setYear(ty); setMonth(tm - 1); setSelected(todayKey) }}>Today</button>
          <button type="button" className="icon-btn" aria-label="Next month" onClick={() => shift(1)}>›</button>
        </div>}>
        <div className="cal-grid">
          {DOW.map((d) => <div key={d} className="cal-dow">{d}</div>)}
          {cells.map((d, i) => {
            if (d === null) return <div key={`b${i}`} className="cal-cell blank" />
            const k = keyOf(d)
            const list = byDay.get(k)
            const t = list ? dayTotals(list) : null
            const v = t ? (mode === 'usd' ? t.usd : t.r) : null
            return (
              <button key={k} type="button" disabled={!t}
                className={`cal-cell ${t ? 'has' : ''} ${k === todayKey ? 'today' : ''} ${k === selected ? 'selected' : ''}`}
                style={t ? { background: shade(v) } : undefined}
                onClick={() => setSelected(k === selected ? null : k)}
                aria-label={t ? `${dayShort(k)}: ${mode === 'usd' ? money(t.usd, { sign: true }) : rText(t.r)}, ${t.count} trades` : `${dayShort(k)}: no trades`}>
                <span className="d">{d}</span>
                {t ? (
                  <>
                    <span className={`p ${tone(v)}`}>{mode === 'usd' ? (Math.abs(t.usd) >= 1000 ? moneyCompact(t.usd) : money(t.usd, { sign: true, dec: 0 })) : rText(t.r)}</span>
                    <span className="s">{t.count} trade{t.count > 1 ? 's' : ''}</span>
                  </>
                ) : <span />}
              </button>
            )
          })}
        </div>
        <div className="legend">
          <span><i style={{ background: 'rgba(53,214,164,.35)' }} />Profit day</span>
          <span><i style={{ background: 'rgba(255,123,107,.35)' }} />Loss day</span>
          <span><i style={{ background: 'var(--inner)', border: '1.5px solid var(--accent)' }} />Today</span>
          <span>Brighter colour means a bigger day. Tap a day for its trades.</span>
        </div>
      </Card>

      {selected && dayTrades.length ? (
        <Card title={`Trades on ${dayShort(selected)}`}>
          {dayTrades.map((t) => (
            <div className="row" key={t.id}>
              <span className="mono muted" style={{ minWidth: 48 }}>{timeHM(t.closed_at)}</span>
              <b style={{ flex: '0 0 96px' }}>{t.symbol}</b>
              <span className={`side ${SIDE_TONE[t.side]}`}>{t.side}</span>
              <span className="soft" style={{ flex: '1 1 160px' }}>{t.strategy}</span>
              <span className="muted" style={{ flex: '1 1 180px', fontSize: 13 }}>
                {t.exit_label || '—'} · {price(t.entry_price)} → {price(t.exit_price)} · {holdText(num(t.hold_hours))}
              </span>
              <span className={`mono ${tone(num(t.r_multiple))}`}>{rText(num(t.r_multiple))}</span>
              <span className={`mono ${tone(num(t.result_usd))}`} style={{ fontWeight: 600, minWidth: 84, textAlign: 'right' }}>{money(num(t.result_usd), { sign: true })}</span>
            </div>
          ))}
        </Card>
      ) : null}
    </>
  )
}
