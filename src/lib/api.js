import { supabase } from './supabase'

const API_URL = (import.meta.env.VITE_API_URL || 'https://fred-automation.vercel.app').replace(/\/$/, '')

// Calls the FRED server with the logged-in user's token. Throws an Error with a readable message.
export async function api(path, { method = 'GET', body } = {}) {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (!token) throw new Error('You are signed out. Please sign in again.')

  let response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new Error('Could not reach the FRED server. Check your connection and try again.')
  }

  let json = null
  try { json = await response.json() } catch { /* not JSON */ }
  if (!response.ok || (json && json.ok === false)) {
    throw new Error(json?.error || `The server answered with an error (${response.status}).`)
  }
  return json
}
