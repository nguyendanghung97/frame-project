import { useEffect } from 'react'
import { useStore } from '@nanostores/react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  PageFrame,
  syncFromBrowserLocation,
  GlobalZoomPlayer,
  $telecomConferenceActiveCall,
  clearTelecomConference,
  useTelecomConferenceLayout,
} from 'frame-common'
import { Header } from '@/components/Header'
import { ReportSidebar } from '@/components/ReportSidebar'

const CONFERENCE_PATH = '/app/conference'

/**
 * React Router uses history.pushState without firing `popstate`.
 * Re-hydrate pageParams / pageSearch from the real browser URL on each navigation.
 */
function AppLocationSync() {
  const location = useLocation()

  useEffect(() => {
    syncFromBrowserLocation()
  }, [location.pathname, location.search, location.hash])

  return null
}

/** Mount once — keeps Zoom alive across tabs; layout via useTelecomConferenceLayout. */
function ShellZoomPlayer() {
  useTelecomConferenceLayout({ conferencePath: CONFERENCE_PATH })

  const call = useStore($telecomConferenceActiveCall)
  if (!call) return null

  return (
    <GlobalZoomPlayer
      signature={call.signature}
      sessionName={call.sessionName}
      userName={call.userName}
      sessionId={call.sessionId}
      sessionDisplay={call.sessionDisplay}
      originPath={call.originPath ?? CONFERENCE_PATH}
      onClose={() => clearTelecomConference()}
    />
  )
}

/**
 * App chrome — MainFrame provides PageContext via frame-common PageFrame.
 */
class MainFrameInner extends PageFrame {
  renderContent() {
    return (
      <div className="app-frame">
        <AppLocationSync />
        <ShellZoomPlayer />
        <div className="app-frame-header">
          <Header />
        </div>
        <div className="app-frame-body">
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
      <aside className="report-frame-sidebar">
        <ReportSidebar />
      </aside>
      <div className="report-frame-content">
        <Outlet />
      </div>
    </div>
  )
}
