// Days are cut at midnight Lagos time everywhere, to match the trade journal.
export const TZ = 'Africa/Lagos'

export function money(v, { sign = false, dec = 2 } = {}) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  v = Number(v)
  const body = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
  return (v < 0 ? '-$' : sign ? '+$' : '$') + body
}

export function moneyCompact(v) {
  if (v === null || v === undefined) return ''
  const a = Math.abs(v)
  const s = a >= 1000 ? `${(a / 1000).toFixed(a >= 10000 ? 1 : 2)}k` : a.toFixed(0)
  return (v < 0 ? '-$' : '$') + s
}

export function rText(v, { sign = true } = {}) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  v = Number(v)
  return `${v > 0 && sign ? '+' : ''}${v.toFixed(2)}R`
}

export function price(v) {
  if (v === null || v === undefined || v === '') return '—'
  return Number(v).toLocaleString('en-US', { maximumSignificantDigits: 7 })
}

export function pct(v, { sign = false, dec = 1 } = {}) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  v = Number(v)
  return `${v > 0 && sign ? '+' : ''}${v.toFixed(dec)}%`
}

export const tone = (v) => (v > 0 ? 'profit' : v < 0 ? 'loss' : 'muted')

export function ago(value, now = Date.now()) {
  if (!value) return 'never'
  const s = Math.max(0, Math.round((now - new Date(value).getTime()) / 1000))
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 48) return `${h} h ago`
  return `${Math.round(h / 24)} d ago`
}

export function holdText(hours) {
  if (hours === null || hours === undefined) return '—'
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 48) return `${hours.toFixed(1)}h`
  return `${(hours / 24).toFixed(1)}d`
}

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
export const dayKey = (value) => dayFmt.format(new Date(value)) // YYYY-MM-DD in Lagos

export function timeHM(value) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value))
}

export function dateShort(value) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short' }).format(new Date(value))
}

export function dateTime(value) {
  return `${dateShort(value)} ${timeHM(value)}`
}

export function longDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-GB', { timeZone: TZ, weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(value))
}

export const SIDE_TONE = { BUY: 'profit', SELL: 'loss', LONG: 'profit', SHORT: 'loss' }

export const REASONS = {
  BOT_PAUSED: 'Trading paused',
  MAX_TRADES: 'Max trades reached',
  PAIR_OPEN: 'Pair already open',
  GRADE_FILTER: 'Grade filter',
  CONDITIONAL_TIER: 'Conditional tier',
  ORDER_TOO_SMALL: 'Order too small',
  STRATEGY_OFF: 'Strategy switched off',
  PAIR_OFF: 'Pair switched off',
  INVALID: 'Invalid alert',
  STALE_PRICE: 'Stale price',
  DUPLICATE: 'Duplicate alert',
  ORDER_FAILED: 'Order failed',
  OTHER: 'Other',
}
