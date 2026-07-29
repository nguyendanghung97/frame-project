import { NavLink } from 'react-router-dom'

export function ReportSidebar() {
  return (
    <nav className="report-sidebar">
      <h2 className="report-sidebar__title">Reports</h2>
      <ul className="report-sidebar__list">
        <li>
          <NavLink
            to="/app/reports"
            end
            className={({ isActive }) =>
              isActive
                ? 'report-sidebar__link report-sidebar__link--active'
                : 'report-sidebar__link'
            }
          >
            Browse
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
