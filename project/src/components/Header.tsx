import { NavLink } from 'react-router-dom'

const links = [
  { to: '/app/home', label: 'Home' },
  { to: '/app/patients', label: 'Patients' },
]

export function Header() {
  return (
    <header className="header">
      <div className="header__brand">frame-project</div>
      <nav className="header__nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              isActive ? 'header__link header__link--active' : 'header__link'
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
