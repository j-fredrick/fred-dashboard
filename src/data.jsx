import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import { api } from './lib/api'

const Ctx = createContext(null)
export const useData = () => useContext(Ctx)

const EMPTY = { trades: [], signals: [], events: [], equity: [], settings: null, history: [], beats: [] }

export function DataProvider({ children }) {
  const [data, setData] = useState(EMPTY)
  const [status, setStatus] = useState({ loading: true, error: null, loadedAt: null })
  const [live, setLive] = useState({ positions: null, error: null, at: null })
  const busy = useRef(false)

  const load = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      const [trades, signals, events, equity, settings, history, beats] = await Promise.all([
        supabase.from('trades').select('*').order('opened_at', { ascending: false }).limit(2000),
        supabase.from('signals').select('*').order('created_at', { ascending: false }).limit(500),
        supabase.from('events').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('equity_snapshots').select('*').order('taken_at', { ascending: false }).limit(2500),
        supabase.from('settings').select('*').maybeSingle(),
        supabase.from('settings_history').select('*').order('changed_at', { ascending: false }).limit(60),
        supabase.from('system_heartbeats').select('*'),
      ])
      const failed = [trades, signals, events, equity, settings, history, beats].find((r) => r.error)
      if (failed) throw new Error(failed.error.message)
      setData({
        trades: trades.data || [],
        signals: signals.data || [],
        events: events.data || [],
        equity: (equity.data || []).slice().reverse(),
        settings: settings.data || null,
        history: history.data || [],
        beats: beats.data || [],
      })
      setStatus({ loading: false, error: null, loadedAt: Date.now() })
    } catch (e) {
      setStatus((s) => ({ ...s, loading: false, error: e.message || 'Could not load data' }))
    } finally {
      busy.current = false
    }
  }, [])

  const loadLive = useCallback(async () => {
    try {
      const res = await api('/api/positions')
      setLive({ positions: res.positions || [], error: null, at: Date.now() })
    } catch (e) {
      setLive((l) => ({ ...l, error: e.message, at: Date.now() }))
    }
  }, [])

  useEffect(() => {
    load()
    loadLive()
    const a = setInterval(load, 30000)
    const b = setInterval(loadLive, 20000)
    const onVisible = () => { if (document.visibilityState === 'visible') { load(); loadLive() } }
    document.addEventListener('visibilitychange', onVisible)
    return () => { clearInterval(a); clearInterval(b); document.removeEventListener('visibilitychange', onVisible) }
  }, [load, loadLive])

  const value = useMemo(() => ({ ...data, ...status, live, refresh: load, refreshLive: loadLive }), [data, status, live, load, loadLive])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
