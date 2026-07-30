import React from 'react'
import { LayoutContext, type LayoutContextType } from '../contexts'

export interface PageLayoutProps {
  className?: string
  children?: React.ReactNode
  title?: string
  sectionClasses?: Record<string, string>
}

export abstract class PageLayout<
  T extends PageLayoutProps = PageLayoutProps,
> extends React.Component<T> {
  private gatherModulesFromChildren(
    children: React.ReactNode[],
  ): Record<string, React.ReactNode[]> {
    const pageModules: Record<string, React.ReactNode[]> = {}

    React.Children.forEach(children, (child) => {
      if (!React.isValidElement(child)) {
        console.warn('[PageLayout] Invalid child element found, skipping:', child)
        return
      }

      const childType = child.type as { name?: string }
      const childProps = child.props as { sectionName?: string }
      let sectionName = childProps?.sectionName

      if (!sectionName || typeof sectionName !== 'string') {
        console.warn(
          `[PageLayout] child missing sectionName prop, defaulting to "main". Component: ${
            childType?.name || 'Unknown'
          }`,
        )
        sectionName = 'main'
      }

      if (!pageModules[sectionName]) {
        pageModules[sectionName] = []
      }
      pageModules[sectionName].push(child)
    })

    return pageModules
  }

  componentDidMount() {
    if (this.props.title) {
      if (typeof document !== 'undefined') {
        document.title = this.props.title
      }
    }
  }

  componentDidUpdate(prevProps: PageLayoutProps) {
    if (prevProps.title !== this.props.title && this.props.title) {
      if (typeof document !== 'undefined') {
        document.title = this.props.title
      }
    }
  }

  abstract renderContent(): React.ReactNode

  render() {
    const modules = this.gatherModulesFromChildren(
      this.props.children as React.ReactNode[],
    )
    const layoutContext: LayoutContextType = {
      modules,
      sectionClasses: this.props.sectionClasses || {},
    }

    return (
      <LayoutContext.Provider value={layoutContext}>
        {this.renderContent()}
      </LayoutContext.Provider>
    )
  }
}
