import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { Card, Icon, PageHead } from '../ui'
import { NAV } from '../lib/nav'
import { ACCOUNT_LABEL } from '../lib/supabase'

export default function More() {
  const { email, signOut } = useAuth()
  const items = NAV.filter((n) => !n.tab || n.to === '/journal')
  return (
    <>
      <PageHead title="More" sub={ACCOUNT_LABEL ? `${ACCOUNT_LABEL} account` : undefined} />
      <Card>
        <nav className="menu-list" aria-label="More pages">
          {items.map((n) => (
            <Link key={n.to} to={n.to}><Icon d={n.d} />{n.label}</Link>
          ))}
        </nav>
      </Card>
      <Card title="Account">
        <div className="soft" style={{ overflowWrap: 'anywhere' }}>Signed in as {email}</div>
        <button type="button" className="btn" onClick={signOut}>Sign out</button>
      </Card>
    </>
  )
}
