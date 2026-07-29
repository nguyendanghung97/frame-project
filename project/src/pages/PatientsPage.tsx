import { PageModule, ThreeColumns } from 'frame-common'

/**
 * ThreeColumns slots: sidebar | main | rightPanel (all shown by default).
 */
export function PatientsPage() {
  return (
    <ThreeColumns
      title="Patients"
      minSidebarWidth={240}
      minRightPanelWidth={280}
      className="h-full overflow-hidden"
    >
      <PageModule sectionName="sidebar" className="h-full">
        <div className="patients-col">
          <h3 className="patients-col__title">Filters</h3>
          <p className="patients-col__text">Sidebar — <code>sectionName="sidebar"</code></p>
        </div>
      </PageModule>

      <PageModule sectionName="main" className="h-full">
        <div className="patients-col">
          <h3 className="patients-col__title">Patients</h3>
          <p className="patients-col__text">Main — <code>sectionName="main"</code></p>
          <ul className="patients-col__list">
            <li>Jane Doe</li>
            <li>John Smith</li>
            <li>Alex Nguyen</li>
          </ul>
        </div>
      </PageModule>

      <PageModule sectionName="rightPanel" className="h-full">
        <div className="patients-col">
          <h3 className="patients-col__title">Detail</h3>
          <p className="patients-col__text">Right panel — <code>sectionName="rightPanel"</code></p>
        </div>
      </PageModule>
    </ThreeColumns>
  )
}
