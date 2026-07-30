import type { ReactNode } from 'react'

export function PageShell({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main className="page">
      <h1 className="page-title">{title}</h1>
      {children ?? <p className="page-hint">Placeholder page — wire domain UI later.</p>}
    </main>
  )
}
