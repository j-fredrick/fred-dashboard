import { useState } from 'react'
import { NavLink, Outlet, Link } from 'react-router-dom'
import { useAuth } from './auth'
import { useData } from './data'
import { api } from './lib/api'
import { ACCOUNT_LABEL } from './lib/supabase'
import { NAV } from './lib/nav'
import { ago } from './lib/format'
import { Icon, WARN_ICON, useToast } from './ui'
import { StatusPill } from './controls'

function ProblemBanner() {
  const { events, refresh } = useData()
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const open = events.filter((e) => !e.resolved_at && (e.level === 'error' || e.level === 'warning'))
  if (!open.length) return null
  const worst = open.find((e) => e.level === 'error') || open[0]

  async function dismiss() {
    setBusy(true)
    try {
      await api('/api/events/resolve', { method: 'POST', body: { all: true } })
      await refresh()
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section role="alert" className={`problem ${worst.level === 'warning' ? 'warning' : ''}`}>
      <Icon d={WARN_ICON} size={22} stroke={2} color={worst.level === 'warning' ? '#F5B94A' : '#FF7B6B'} />
      <div className="text">
        <div className="title">Problem: {worst.title}</div>
        <div className="detail">
          {worst.detail ? `${String(worst.detail).slice(0, 220)} · ` : ''}{ago(worst.created_at)}
          {open.length > 1 ? ` · +${open.length - 1} more` : ''}
        </div>
      </div>
      <div className="actions">
        <Link className="btn danger" to="/health" style={{ textDecoration: 'none' }}>View details</Link>
        <button type="button" className="btn" onClick={dismiss} disabled={busy}>
          {open.length > 1 ? `Dismiss all (${open.length})` : 'Dismiss'}
        </button>
      </div>
    </section>
  )
}

export default function Layout() {
  const { email, signOut } = useAuth()
  const { error } = useData()
  const tabs = NAV.filter((n) => n.tab)

  return (
    <div className="app">
      <nav className="sidebar" aria-label="Main">
        <div className="logo"><img src="/logo.png" alt="FRED" /></div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `navlink ${isActive ? 'active' : ''}`}>
            <Icon d={n.d} />
            <span>{n.label}</span>
          </NavLink>
        ))}
        <div className="side-foot">
          <span className="account-tag">{ACCOUNT_LABEL}</span>
          <div className="email">{email}</div>
          <button type="button" className="btn small" onClick={signOut}>Sign out</button>
        </div>
      </nav>

      <div style={{ flex: '1 1 auto', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="topbar">
          <img src="/logo.png" alt="FRED" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="account-tag" style={{ fontSize: 11, padding: '5px 9px' }}>{ACCOUNT_LABEL.split(' ')[0]}</span>
            <StatusPill />
          </div>
        </div>
        <main className="main">
          {error ? (
            <div className="notice error" role="alert">
              <Icon d={WARN_ICON} size={17} stroke={2} color="#FF7B6B" />
              <div>Could not load the latest data ({error}). The numbers below may be out of date. It retries every 30 seconds.</div>
            </div>
          ) : null}
          <ProblemBanner />
          <Outlet />
        </main>
      </div>

      <nav className="tabbar" aria-label="Main">
        {tabs.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
            <Icon d={n.d} size={22} />
            <span>{n.short || n.label}</span>
          </NavLink>
        ))}
        <NavLink to="/more" className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>
          <Icon d="M5 12h.01M12 12h.01M19 12h.01" size={22} stroke={3} />
          <span>More</span>
        </NavLink>
      </nav>
    </div>
  )
}
