import { NavLink } from 'react-router-dom'
import { buildUrlFragments, usePageContext } from 'frame-common'

const links = [
  { to: '/home', label: 'Home' },
  { to: '/patients', label: 'Patients' },
  { to: '/conference', label: 'Conference' },
]

export function Header() {
  const { pageParams } = usePageContext()
  // RR `location.hash` stays stale after `updatePageParams` (history.replaceState outside RR).
  // Build hash from pageParams so tab switches keep `#signature:…`, etc.
  const hash = buildUrlFragments(pageParams)

  return (
    <header className="header">
      <div className="header-brand">frame-project</div>
      <nav className="header-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={{ pathname: link.to, hash: hash || undefined }}
            className={({ isActive }) =>
              isActive ? 'header-link header-link-active' : 'header-link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
