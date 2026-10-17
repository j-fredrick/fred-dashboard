export const NAV = [
  { to: '/', label: 'Overview', d: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', tab: true },
  { to: '/positions', label: 'Live positions', short: 'Positions', d: 'M3 17l6-6 4 4 8-8M15 7h6v6', tab: true },
  { to: '/signals', label: 'Signals', d: 'M2 12h4l3-8 4 16 3-8h6', tab: true },
  { to: '/journal', label: 'Journal', d: 'M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM8 8h8' },
  { to: '/calendar', label: 'Calendar', d: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', tab: true },
  { to: '/performance', label: 'Performance', d: 'M5 20V10M12 20V4M19 20v-7' },
  { to: '/health', label: 'System health', short: 'Health', d: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
  { to: '/settings', label: 'Settings', d: 'M4 7h10M18 7h2M4 17h2M10 17h10M14 5v4M6 15v4', tab: true },
]

// Pairs the strategy has been backtested on. Must match ALLOWED_PAIRS in the server's config.py.
export const PAIRS = ['BTCUSDT', 'ETHUSDT', 'LTCUSDT', 'XRPUSDT', 'DOGEUSDT', 'ADAUSDT', 'SOLUSDT', 'AVAXUSDT', 'BNBUSDT', 'UNIUSDT']

export const STRATEGIES = [
  { name: 'Strong Candle Zone', hint: 'Trailing order from the 3:1 level' },
  { name: 'Momentum Continuation', hint: 'Trailing order from the 3:1 level' },
  { name: 'Mean Reversion (50-MA)', hint: 'Limit order take-profit at the 50-MA' },
]
