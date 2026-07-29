import { PageFrame } from 'frame-common'
import { Outlet } from 'react-router-dom'
import { Header } from '@/components/Header'
import { ReportSidebar } from '@/components/ReportSidebar'

/**
 * App chrome — MainFrame provides PageContext via frame-common PageFrame.
 */
class MainFrameInner extends PageFrame {
  renderContent() {
    return (
      <div className="app-frame">
        <div className="app-frame__header">
          <Header />
        </div>
        <div className="app-frame__body">
          <Outlet />
        </div>
      </div>
    )
  }
}

export function MainFrame() {
  return <MainFrameInner />
}

export function ReportFrame() {
  return (
    <div className="report-frame">
      <aside className="report-frame__sidebar">
        <ReportSidebar />
      </aside>
      <div className="report-frame__content">
        <Outlet />
      </div>
    </div>
  )
}
