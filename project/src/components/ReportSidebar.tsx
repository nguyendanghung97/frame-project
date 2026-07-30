import { NavLink } from 'react-router-dom'

export function ReportSidebar() {
  return (
    <nav className="report-sidebar">
      <h2 className="report-sidebar-title">Reports</h2>
      <ul className="report-sidebar-list">
        <li>
          <NavLink
            to="/app/reports"
            end
            className={({ isActive }) =>
              isActive
                ? 'report-sidebar-link report-sidebar-link-active'
                : 'report-sidebar-link'
            }
          >
            Browse
          </NavLink>
        </li>
      </ul>
    </nav>
  )
}
