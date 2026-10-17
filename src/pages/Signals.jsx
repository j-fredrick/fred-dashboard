import { useMemo, useState } from 'react'
import { useData } from '../data'
import { Card, PageHead, Segmented } from '../ui'
import { SignalRow } from '../components'
import { REASONS } from '../lib/format'

const OUTCOMES = [
  { value: 'all', label: 'All' },
  { value: 'traded', label: 'Traded' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'error', label: 'Error' },
]

export default function Signals() {
  const { signals, loading } = useData()
  const [outcome, setOutcome] = useState('all')
  const [reason, setReason] = useState('all')
  const [limit, setLimit] = useState(40)

  const week = useMemo(() => signals.filter((s) => Date.now() - new Date(s.created_at).getTime() < 7 * 86400000), [signals])
  const breakdown = useMemo(() => {
    const counts = {}
    week.filter((s) => s.outcome !== 'traded').forEach((s) => {
      const k = s.reason_code || 'OTHER'
      counts[k] = (counts[k] || 0) + 1
    })
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [week])

  const reasonOptions = useMemo(() => [...new Set(signals.filter((s) => s.outcome !== 'traded').map((s) => s.reason_code || 'OTHER'))], [signals])
  const filtered = signals.filter((s) =>
    (outcome === 'all' || s.outcome === outcome) && (reason === 'all' || (s.reason_code || 'OTHER') === reason))
  const shown = filtered.slice(0, limit)
  const traded = week.filter((s) => s.outcome === 'traded').length
  const maxCount = breakdown.length ? breakdown[0][1] : 1

  return (
    <>
      <PageHead title="Signals" sub="Every alert the bot received, including the ones it did not trade, with the reason." />

      <section className="two-col">
        <Card className="wide" title="Signal log" right={<span className="muted" style={{ fontSize: 13 }}>{filtered.length} shown</span>}>
          <div className="filters">
            <Segmented value={outcome} onChange={setOutcome} options={OUTCOMES} />
            <select className="input" value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Filter by reason">
              <option value="all">Any reason</option>
              {reasonOptions.map((r) => <option key={r} value={r}>{REASONS[r] || r}</option>)}
            </select>
          </div>
          {loading ? <div className="empty">Loading…</div> : shown.length === 0
            ? <div className="empty">{signals.length ? 'No signals match these filters.' : 'No signals yet. They appear here as soon as an hourly check fires one.'}</div>
            : shown.map((s) => <SignalRow key={s.id} s={s} />)}
          {filtered.length > limit ? <button type="button" className="btn" onClick={() => setLimit(limit + 40)}>Show more</button> : null}
        </Card>

        <Card className="narrow" title="Last 7 days">
          <div className="kv">
            <div className="inner"><div className="k">Signals</div><div className="v">{week.length}</div></div>
            <div className="inner"><div className="k">Traded</div><div className="v profit">{traded}</div></div>
          </div>
          <div className="muted" style={{ fontSize: 13 }}>Why signals were not traded</div>
          {breakdown.length === 0 ? <div className="empty">Nothing rejected this week.</div> : breakdown.map(([code, n]) => (
            <div key={code} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span>{REASONS[code] || code}</span><span className="mono">{n}</span>
              </div>
              <div className="bar"><i style={{ width: `${(n / maxCount) * 100}%`, background: 'var(--warn)' }} /></div>
            </div>
          ))}
        </Card>
      </section>
    </>
  )
}
