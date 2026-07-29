import type { PageModuleProps } from 'frame-common'
import { TwoColumnsWithRightPanel } from 'frame-common'

function HomeMain(props: PageModuleProps) {
  return (
    <div className={props.className}>
      <h2 className="home-main__title">Welcome</h2>
      <p className="home-main__text">
        Main column — same pattern as ncs-network <code>LandingPage</code> with{' '}
        <code>sectionName="main"</code>.
      </p>
    </div>
  )
}

function HomeRightPanel(props: PageModuleProps) {
  return (
    <div className={props.className}>
      <h3 className="home-aside__title">Quick links</h3>
      <ul className="home-aside__list">
        <li>View reports</li>
        <li>Manage patients</li>
        <li>Open settings</li>
      </ul>
    </div>
  )
}

export function HomePage() {
  return (
    <TwoColumnsWithRightPanel
      title="Home"
      minRightPanelWidth={280}
      className="home-layout"
      sectionClasses={{
        main: 'home-layout__main',
        rightPanel: 'home-layout__aside',
      }}
    >
      <HomeMain sectionName="main" />
      <HomeRightPanel sectionName="rightPanel" />
    </TwoColumnsWithRightPanel>
  )
}
