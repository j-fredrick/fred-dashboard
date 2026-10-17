import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './auth'
import { DataProvider } from './data'
import { configured } from './lib/supabase'
import { ToastProvider, Notice } from './ui'
import Layout from './Layout'
import Overview from './pages/Overview'
import Positions from './pages/Positions'
import Signals from './pages/Signals'
import Journal from './pages/Journal'
import Calendar from './pages/Calendar'
import Performance from './pages/Performance'
import Health from './pages/Health'
import Settings from './pages/Settings'
import More from './pages/More'

function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await signIn(email.trim(), password)
    if (err) setError(err.message === 'Invalid login credentials' ? 'Wrong email or password.' : err.message)
    setBusy(false)
  }

  return (
    <div className="login">
      <form onSubmit={submit}>
        <img src="/logo.png" alt="FRED" />
        <h1 style={{ fontSize: 24 }}>Sign in</h1>
        {!configured ? (
          <Notice tone="warn">This app is not connected to Supabase yet. Fill in <b>.env</b> (see README) and rebuild.</Notice>
        ) : null}
        <label>Email
          <input className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>Password
          <input className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <Notice tone="error">{error}</Notice> : null}
        <button className="btn primary block" type="submit" disabled={busy || !configured}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  )
}

function Gate() {
  const { loading, session, role, roleError, signOut } = useAuth()
  if (loading) return <div className="splash">Loading…</div>
  if (!session) return <Login />
  if (role !== 'owner') {
    return (
      <div className="login">
        <form onSubmit={(e) => e.preventDefault()}>
          <img src="/logo.png" alt="FRED" />
          <Notice tone="error">
            {roleError ? `Could not check this account (${roleError}).` : 'This account is not allowed to open the FRED dashboard.'}
          </Notice>
          <button className="btn block" type="button" onClick={signOut}>Sign out</button>
        </form>
      </div>
    )
  }
  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="positions" element={<Positions />} />
          <Route path="signals" element={<Signals />} />
          <Route path="journal" element={<Journal />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="performance" element={<Performance />} />
          <Route path="health" element={<Health />} />
          <Route path="settings" element={<Settings />} />
          <Route path="more" element={<More />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </DataProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
