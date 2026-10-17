# FRED Dashboard

React dashboard for the FRED trading bot. It reads trades, signals, events and settings straight from Supabase (read-only, protected by row-level security) and sends every action (pause, resume, settings, close one pair) to the bot server's `/api` routes. It never talks to Binance directly and never holds a secret key.

## Run it on your computer

```bash
cp .env.example .env      # then fill in the four values below
npm install
npm run dev               # http://localhost:5173
```

`.env` values:

| Name | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | The **public** (anon / publishable) key. Never the secret or service key. |
| `VITE_API_URL` | `https://fred-automation.vercel.app` |
| `VITE_ACCOUNT_LABEL` | `DEMO` now, change to `LIVE` when you trade real money |

Sign in with the Supabase user you created in Phase 1. Only the account with `role = owner` in `profiles` can open the dashboard.

## Put it online

1. Create a new GitHub repository (for example `fred-dashboard`) and push this folder to it. `.env` is git-ignored.
2. In Vercel choose **Add New > Project**, import that repository. The framework is detected as Vite.
3. Add the same four `VITE_` variables under **Settings > Environment Variables**, then deploy.
4. Optional, recommended: in the **bot server** project (`fred-automation`) add the variable `DASHBOARD_ORIGIN` set to your dashboard's address (for example `https://fred-dashboard.vercel.app`) and redeploy it. This makes the server accept browser requests only from your dashboard.

`vercel.json` already rewrites every path to `index.html`, so refreshing on any page works.

## Notes

- Data refreshes every 30 seconds, live positions every 20 seconds, and whenever you return to the tab.
- Days are cut at midnight Lagos time (`Africa/Lagos`), matching the Google Sheet journal.
- Pairs offered in Settings must match `ALLOWED_PAIRS` in the server's `config.py`.
- There is deliberately no close-all button.
