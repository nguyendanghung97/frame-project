import {
  Discussion,
  PageModule,
  ThreeColumns,
  updateModuleState,
  updatePageParams,
  usePageContext,
} from 'frame-common'

const PATIENTS = ['Jane Doe', 'John Smith', 'Alex Nguyen'] as const
const FILTERS_MODULE = 'patients-filters'

function UserIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  )
}

function PatientsFilters() {
  const { moduleState } = usePageContext()
  const sort = (moduleState[FILTERS_MODULE]?.sort as string) ?? 'name-asc'

  return (
    <div className="patients-col">
      <h3 className="patients-col-title">Filters</h3>
      <p className="patients-col-text">
        Sort via <code>updateModuleState</code> (not in URL — lost on reload)
      </p>
      <label className="patients-col-text">
        Sort{' '}
        <select
          value={sort}
          onChange={(e) => {
            updateModuleState(FILTERS_MODULE, { sort: e.target.value })
          }}
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
      </label>
    </div>
  )
}

function PatientsMain() {
  const { pageParams, moduleState } = usePageContext()
  const selected = pageParams.patient as string | undefined
  const sort = (moduleState[FILTERS_MODULE]?.sort as string) ?? 'name-asc'

  const names = [...PATIENTS].sort((a, b) =>
    sort === 'name-desc' ? b.localeCompare(a) : a.localeCompare(b),
  )

  return (
    <div className="patients-col">
      <h3 className="patients-col-title">Patients</h3>
      <p className="patients-col-text">
        HMR check — teal styles + user icon (no <code>frame-common</code> build)
      </p>
      <ul className="patients-col-list">
        {names.map((name) => (
          <li key={name}>
            <button
              type="button"
              className={
                selected === name
                  ? 'patients-col-btn patients-col-btn-active'
                  : 'patients-col-btn'
              }
              onClick={() => {
                updatePageParams({ patient: name })
              }}
            >
              <UserIcon className="patients-col-icon" />
              <span>{name}</span>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="patients-col-btn"
        onClick={() => {
          updatePageParams({}, ['patient'])
        }}
      >
        Clear selection
      </button>
    </div>
  )
}

function PatientsDetail() {
  const { pageParams } = usePageContext()
  const selected = pageParams.patient as string | undefined
  const resourceId = selected
    ? `patient-${selected.toLowerCase().replace(/\s+/g, '-')}`
    : 'demo-entry-001'

  return (
    <div className="patients-col patients-col--discussion">
      {selected ? (
        <p className="patients-col-text patients-col-text--compact">
          <UserIcon className="patients-col-icon" /> {selected}
        </p>
      ) : (
        <p className="patients-col-text patients-col-text--compact">
          Pick a patient — demo thread below
        </p>
      )}
      <div className="patients-discussion">
        <Discussion
          key={resourceId}
          defaultResource="patient"
          defaultResourceId={resourceId}
        />
      </div>
    </div>
  )
}

/**
 * pageParams = reload-safe (URL). moduleState = transient UI (sort).
 */
export function PatientsPage() {
  return (
    <ThreeColumns
      title="Patients"
      minSidebarWidth={240}
      minRightPanelWidth={540}
      className="h-full overflow-hidden"
    >
      <PageModule sectionName="sidebar" className="h-full">
        <PatientsFilters />
      </PageModule>

      <PageModule sectionName="main" className="h-full">
        <PatientsMain />
      </PageModule>

      <PageModule sectionName="rightPanel" className="h-full">
        <PatientsDetail />
      </PageModule>
    </ThreeColumns>
  )
}
