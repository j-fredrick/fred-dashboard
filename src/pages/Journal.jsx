import { useMemo, useState } from 'react'
import { useData } from '../data'
import { Card, Notice, PageHead, Segmented } from '../ui'
import { dateTime, holdText, money, price, rText, tone, SIDE_TONE } from '../lib/format'
import { num } from '../lib/stats'

const STATUS = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
]

export default function Journal() {
  const { trades, loading } = useData()
  const [status, setStatus] = useState('all')
  const [pair, setPair] = useState('all')
  const [strategy, setStrategy] = useState('all')
  const [q, setQ] = useState('')
  const [limit, setLimit] = useState(50)

  const pairs = useMemo(() => [...new Set(trades.map((t) => t.symbol))].sort(), [trades])
  const strategies = useMemo(() => [...new Set(trades.map((t) => t.strategy))].sort(), [trades])
  const filtered = trades.filter((t) =>
    (status === 'all' || t.status === status) &&
    (pair === 'all' || t.symbol === pair) &&
    (strategy === 'all' || t.strategy === strategy) &&
    (!q || `${t.symbol} ${t.strategy} ${t.exit_label || ''} ${t.exit_note || ''}`.toLowerCase().includes(q.toLowerCase())))
  const shown = filtered.slice(0, limit)

  return (
    <>
      <PageHead title="Trade journal" sub="Every trade the bot has opened. Newest first." />
      <Notice>Your Google Sheet is still the journal of record. This page is a faster, filterable view of the same trades.</Notice>

      <Card title="Trades" right={<span className="muted" style={{ fontSize: 13 }}>{filtered.length} trades</span>}>
        <div className="filters">
          <Segmented value={status} onChange={setStatus} options={STATUS} />
          <select className="input" value={pair} onChange={(e) => setPair(e.target.value)} aria-label="Pair">
            <option value="all">All pairs</option>
            {pairs.map((p) => <option key={p}>{p}</option>)}
          </select>
          <select className="input" value={strategy} onChange={(e) => setStrategy(e.target.value)} aria-label="Strategy">
            <option value="all">All strategies</option>
            {strategies.map((p) => <option key={p}>{p}</option>)}
          </select>
          <input className="input" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search trades" />
        </div>

        {loading ? <div className="empty">Loading…</div> : shown.length === 0 ? (
          <div className="empty">{trades.length ? 'No trades match these filters.' : 'No trades yet.'}</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Opened</th><th>Pair</th><th>Side</th><th>Strategy</th><th>Grade</th>
                  <th className="num">Entry</th><th className="num">Exit</th><th>Exit reason</th>
                  <th className="num">Held</th><th className="num">R</th><th className="num">P&amp;L</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((t) => (
                  <tr key={t.id}>
                    <td className="mono">{dateTime(t.opened_at)}</td>
                    <td><b>{t.symbol}</b></td>
                    <td><span className={`side ${SIDE_TONE[t.side]}`}>{t.side}</span></td>
                    <td>{t.strategy}</td>
                    <td>{t.grade || '—'}</td>
                    <td className="num">{price(t.entry_price ?? t.signal_entry)}</td>
                    <td className="num">{t.status === 'open' ? '—' : price(t.exit_price)}</td>
                    <td>{t.status === 'open' ? <span className="tag warn">Open</span> : (t.exit_label || '—')}</td>
                    <td className="num">{t.status === 'open' ? '—' : holdText(num(t.hold_hours))}</td>
                    <td className={`num ${tone(num(t.r_multiple))}`}>{t.status === 'open' ? '—' : rText(num(t.r_multiple))}</td>
                    <td className={`num ${tone(num(t.result_usd))}`}>{t.status === 'open' ? '—' : money(num(t.result_usd), { sign: true })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length > limit ? <button type="button" className="btn" onClick={() => setLimit(limit + 50)}>Show more</button> : null}
      </Card>
    </>
  )
}
