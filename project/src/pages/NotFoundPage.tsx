import { Link } from 'react-router-dom'
import { PageShell } from './PageShell'

export function NotFoundPage() {
  return (
    <PageShell title="404">
      <p className="page-hint">Page not found.</p>
      <Link to="/app/home">Back to home</Link>
    </PageShell>
  )
}
