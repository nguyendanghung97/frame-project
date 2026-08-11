import type { PageModuleProps } from 'frame-common/frame_layout'
import { ThreeColumns } from 'frame-common/layouts'

function HomeRightPanel(props: PageModuleProps) {
  return (
    <div className={props.className}>
      <h2 className="p-4 font-bold">Details</h2>
      <p className="p-4">Additional info goes here.</p>
    </div>
  )
}

function HomeSidebar(props: PageModuleProps) {
  return (
    <div className={props.className}>
      <ul className="p-4 space-y-2">
        <li>Dashboard</li>
        <li>Analytics</li>
      </ul>
    </div>
  )
}

function HomeMain(props: PageModuleProps) {
  return (
    <div className={props.className}>
      <p>Welcome to the home page content.</p>
    </div>
  )
}

export function HomePage() {
  return (
    <ThreeColumns className="home-layout">
      <HomeSidebar sectionName="sidebar" />
      <HomeMain sectionName="main" />
      <HomeRightPanel sectionName="rightPanel" />
    </ThreeColumns>
  )
}
