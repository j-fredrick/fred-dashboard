import { useMemo } from 'react'
import { useData } from '../data'
import { Card, PageHead, Stat } from '../ui'
import { money, pct, rText, tone } from '../lib/format'
import { groupPerformance, isClosed, maxDrawdown, performance } from '../lib/stats'

function Breakdown({ title, rows }) {
  return (
    <Card title={title}>
      {rows.length === 0 ? <div className="empty">No closed trades yet.</div> : (
        <div className="table-wrap">
          <table style={{ minWidth: 0 }}>
            <thead><tr><th>Name</th><th className="num">Trades</th><th className="num">Win rate</th><th className="num">Avg R</th><th className="num">P&amp;L</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name}>
                  <td>{r.name}</td>
                  <td className="num">{r.n}</td>
                  <td className="num">{pct(r.winRate, { dec: 0 })}</td>
                  <td className={`num ${tone(r.avgR)}`}>{rText(r.avgR)}</td>
                  <td className={`num ${tone(r.total)}`}>{money(r.total, { sign: true })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default function Performance() {
  const { trades, loading } = useData()
  const closed = useMemo(() => trades.filter(isClosed), [trades])
  const p = useMemo(() => performance(closed), [closed])
  const dd = useMemo(() => maxDrawdown(closed), [closed])
  const expectancy = p.n ? p.total / p.n : null
  const pf = p.profitFactor === Infinity ? '∞' : p.profitFactor === null ? '—' : p.profitFactor.toFixed(2)

  const byStrategy = useMemo(() => groupPerformance(closed, (t) => t.strategy), [closed])
  const bySession = useMemo(() => groupPerformance(closed, (t) => t.session), [closed])
  const byPair = useMemo(() => groupPerformance(closed, (t) => t.symbol), [closed])
  const byExit = useMemo(() => groupPerformance(closed, (t) => t.exit_label), [closed])

  return (
    <>
      <PageHead title="Performance" sub={p.n ? `Based on ${p.n} closed trades. A small sample says little, so judge it over 50 or more.` : 'Closed trades only.'} />
      {!loading && p.n === 0 ? <Card><div className="empty">No closed trades yet. Numbers appear after the first trade finishes.</div></Card> : (
        <>
          <section className="grid-stats">
            <Stat label="Win rate" value={pct(p.winRate, { dec: 0 })} sub={`${p.wins} wins · ${p.losses} losses`} />
            <Stat label="Average R" value={rText(p.avgR)} tone={tone(p.avgR)} sub="Per trade, after risk" />
            <Stat label="Profit factor" value={pf} sub="Gross wins ÷ gross losses" tone={p.profitFactor !== null && p.profitFactor >= 1 ? 'profit' : p.profitFactor !== null ? 'loss' : ''} />
            <Stat label="Expectancy" value={money(expectancy, { sign: true })} tone={tone(expectancy)} sub="Average dollars per trade" />
          </section>
          <section className="grid-stats">
            <Stat label="Total P&L" value={money(p.total, { sign: true })} tone={tone(p.total)} sub={rText(p.totalR)} />
            <Stat label="Max drawdown" value={money(dd)} tone={dd < 0 ? 'loss' : ''} sub="Worst fall from a peak" />
            <Stat label="Average win" value={money(p.avgWin, { sign: true })} tone="profit" sub={`Best ${money(p.best, { sign: true })}`} />
            <Stat label="Average loss" value={money(p.avgLoss)} tone="loss" sub={`Worst ${money(p.worst)}`} />
          </section>
          <section className="settings-grid">
            <Breakdown title="By strategy" rows={byStrategy} />
            <Breakdown title="By session" rows={bySession} />
            <Breakdown title="By pair" rows={byPair} />
            <Breakdown title="By exit reason" rows={byExit} />
          </section>
        </>
      )}
    </>
  )
}
