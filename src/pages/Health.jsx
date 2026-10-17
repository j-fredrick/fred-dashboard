import { useState } from 'react'
import { useData } from '../data'
import { api } from '../lib/api'
import { Card, Icon, Notice, PageHead, Pill, WARN_ICON, useToast } from '../ui'
import { ago, dateTime } from '../lib/format'
import { heartbeatState } from '../lib/stats'

const JOBS = [
  { job: 'run-checks', label: 'Signal check', hint: 'Runs every hour, looks for new setups.', max: 65 },
  { job: 'manage-trades', label: 'Trade check', hint: 'Runs every 5 minutes, watches open trades and records results.', max: 10 },
]
const TONE = { profit: 'profit', warn: 'warn', loss: 'loss', muted: 'muted' }

export default function Health() {
  const { beats, events, live, refresh, refreshLive } = useData()
  const toast = useToast()
  const [busy, setBusy] = useState(null)
  const open = events.filter((e) => !e.resolved_at && e.level !== 'info')
  const recent = events.slice(0, 40)

  async function resolve(id) {
    setBusy(id)
    try {
      await api('/api/events/resolve', { method: 'POST', body: { id } })
      await refresh()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <PageHead title="System health" sub="Is the bot running, and has anything gone wrong?">
        <button type="button" className="btn small" onClick={() => { refresh(); refreshLive() }}>Refresh</button>
      </PageHead>

      <section className="auto-grid">
        {JOBS.map(({ job, label, hint, max }) => {
          const b = beats.find((x) => x.job === job)
          const s = heartbeatState(b, max)
          return (
            <Card key={job} title={label} right={<Pill tone={TONE[s.tone]}>{s.label}</Pill>}>
              <div className="muted" style={{ fontSize: 13 }}>{hint}</div>
              <div className="kv">
                <div className="inner"><div className="k">Last run</div><div className="v">{b ? ago(b.last_run_at) : 'never'}</div></div>
                <div className="inner"><div className="k">At</div><div className="v">{b ? dateTime(b.last_run_at) : '—'}</div></div>
              </div>
              {b?.status === 'error' && b.detail ? <Notice tone="error">{b.detail}</Notice> : null}
            </Card>
          )
        })}
        <Card title="Binance connection" right={<Pill tone={live.error ? 'loss' : live.positions ? 'profit' : 'muted'}>{live.error ? 'unreachable' : live.positions ? 'connected' : 'checking'}</Pill>}>
          <div className="muted" style={{ fontSize: 13 }}>The dashboard asks the bot server for live positions every 20 seconds.</div>
          <div className="kv">
            <div className="inner"><div className="k">Last check</div><div className="v">{live.at ? ago(live.at) : '—'}</div></div>
            <div className="inner"><div className="k">Open positions</div><div className="v">{live.positions ? live.positions.length : '—'}</div></div>
          </div>
          {live.error ? <Notice tone="error">{live.error}</Notice> : null}
        </Card>
      </section>

      <Card title="Problems" right={<span className="muted" style={{ fontSize: 13 }}>{open.length} open</span>}>
        {open.length === 0 ? <div className="empty">No open problems.</div> : open.map((e) => (
          <div className="row" key={e.id}>
            <Icon d={WARN_ICON} size={18} color={e.level === 'error' ? '#FF7B6B' : '#F5B94A'} />
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ fontWeight: 600 }}>{e.title}{e.symbol ? ` · ${e.symbol}` : ''}</div>
              {e.detail ? <div className="muted" style={{ fontSize: 13, overflowWrap: 'anywhere' }}>{e.detail}</div> : null}
              <div className="muted mono" style={{ fontSize: 12 }}>{e.source} · {ago(e.created_at)}</div>
            </div>
            <button type="button" className="btn small" disabled={busy === e.id} onClick={() => resolve(e.id)}>Dismiss</button>
          </div>
        ))}
      </Card>

      <Card title="Recent activity">
        {recent.length === 0 ? <div className="empty">Nothing logged yet.</div> : recent.map((e) => (
          <div className="row" key={e.id}>
            <span className="mono muted" style={{ minWidth: 104 }}>{dateTime(e.created_at)}</span>
            <span className={`tag ${e.level === 'error' ? 'loss' : e.level === 'warning' ? 'warn' : 'muted'}`}>{e.level}</span>
            <span style={{ flex: '1 1 260px', minWidth: 0 }}>
              {e.title}{e.symbol ? ` · ${e.symbol}` : ''}
              {e.detail ? <span className="muted" style={{ fontSize: 13 }}> — {String(e.detail).slice(0, 160)}</span> : null}
            </span>
            <span className="muted" style={{ fontSize: 12 }}>{e.resolved_at ? 'dismissed' : e.source}</span>
          </div>
        ))}
      </Card>
    </>
  )
}
