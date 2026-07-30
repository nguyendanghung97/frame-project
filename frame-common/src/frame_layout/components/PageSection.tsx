import React, { useContext } from 'react'
import { LayoutContext, PageContext } from '../contexts'
import { cn } from '../cn'
import type { ParamSpec } from '../types'

export interface PageSectionProps {
  name: string
  condition?: ParamSpec
  className?: string
  tag?: 'div' | 'section' | 'header' | 'footer' | 'main' | 'aside'
  children?: React.ReactNode
}

export const PageSection = (props: PageSectionProps) => {
  const layoutContext = useContext(LayoutContext)
  const pageContext = useContext(PageContext)
  const { name: sectionName, tag = 'section', className } = props

  if (!layoutContext) {
    return (
      <div className="page-section page-section-error">
        ERROR: PageSection [{sectionName}] must be rendered within a PageLayout
      </div>
    )
  }

  if (props.condition) {
    const match = pageContext
      ? pageContext.matchPageParams(props.condition, `Section[${sectionName}]`)
      : Object.keys(props.condition).length === 0
    if (!match) return null
  }

  const sectionClass = cn(
    'page-section',
    layoutContext.sectionClasses[sectionName],
    className,
  )

  const sectionModules = layoutContext.modules[sectionName] ?? []
  const sectionContent =
    sectionModules.length > 0 ? sectionModules : props.children

  return React.createElement(
    tag,
    {
      className: sectionClass,
      'data-section-name': sectionName,
    },
    sectionContent,
  )
}
