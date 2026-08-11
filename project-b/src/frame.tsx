import { Outlet, Link } from 'react-router-dom'
import { PageFrame } from 'frame-common/frame_layout'

function Header() {
  return (
    <nav className="bg-gray-800 text-white p-4 flex gap-4 w-full">
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
    </nav>
  )
}

export class AppFrameInner extends PageFrame {
  renderContent() {
    return (
      <div className="app-frame">
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

export function AppFrame() {
  return <AppFrameInner />
}
