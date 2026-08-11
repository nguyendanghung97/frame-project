import type { PageModuleProps } from 'frame-common/frame_layout'
import { ThreeColumns } from 'frame-common/layouts'

function AboutRightPanel(props: PageModuleProps) {
  return (
    <div className={props.className}>
      <h2 className="p-4 font-bold">Contact info</h2>
      <p className="p-4">Some extra details...</p>
    </div>
  )
}

function AboutSidebar(props: PageModuleProps) {
  return (
    <div className={props.className}>
      <ul className="p-4 space-y-2">
        <li>Company</li>
        <li>Team</li>
      </ul>
    </div>
  )
}

function AboutMain(props: PageModuleProps) {
  return (
    <div className={props.className}>
      <p>This is the about page content.</p>
    </div>
  )
}

export function AboutPage() {
  return (
    <ThreeColumns className="about-layout">
      <AboutSidebar sectionName="sidebar" />
      <AboutMain sectionName="main" />
      <AboutRightPanel sectionName="rightPanel" />
    </ThreeColumns>
  )
}
