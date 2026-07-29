import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export { HomePage } from './HomePage'
export { PatientsPage } from './PatientsPage'

export function PageShell({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="page">
      <h1 className="page__title">{title}</h1>
      {children ?? <p className="page__hint">Placeholder page — wire domain UI later.</p>}
    </main>
  )
}

export function NotFoundPage() {
  return (
    <PageShell title="404">
      <p className="page__hint">Page not found.</p>
      <Link to="/app/home">Back to home</Link>
    </PageShell>
  )
}
