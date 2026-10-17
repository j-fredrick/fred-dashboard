import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, configured } from './lib/supabase'

const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, session: null, role: null, roleError: null })

  useEffect(() => {
    if (!configured) { setState({ loading: false, session: null, role: null, roleError: null }); return }
    let alive = true

    async function resolve(session) {
      if (!session) { if (alive) setState({ loading: false, session: null, role: null, roleError: null }); return }
      const { data, error } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      if (!alive) return
      setState({ loading: false, session, role: data?.role || null, roleError: error ? error.message : null })
    }

    supabase.auth.getSession().then(({ data }) => resolve(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => { setTimeout(() => resolve(session), 0) })
    return () => { alive = false; sub.subscription.unsubscribe() }
  }, [])

  const value = {
    ...state,
    email: state.session?.user?.email || '',
    signIn: (email, password) => supabase.auth.signInWithPassword({ email, password }),
    signOut: () => supabase.auth.signOut(),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}
