import React from 'react'
import { LayoutContext, PageContext, type LayoutContextType } from '../contexts'
import { cn } from '../cn'
import type { ParamSpec } from '../types'

export interface PageModuleProps {
  children?: React.ReactNode
  sectionName: string
  condition?: ParamSpec
  className?: string
  moduleName?: string
}

let moduleSeq = 0

export class PageModule<
  P extends PageModuleProps = PageModuleProps,
> extends React.Component<P> {
  private moduleIdValue: string
  private moduleName: string
  static contextType = PageContext
  declare readonly context: React.ContextType<typeof PageContext>

  constructor(props: P) {
    super(props)
    this.moduleIdValue = this.generateModuleId(props)
    this.moduleName = props.moduleName || this.moduleIdValue
  }

  generateModuleId(props: P): string {
    moduleSeq += 1
    return `${props.sectionName}-${moduleSeq}`
  }

  get moduleId(): string {
    return this.moduleIdValue
  }

  renderContent(): React.ReactNode {
    return this.props.children
  }

  renderContext(_layoutContext: LayoutContextType | null) {
    if (
      this.context &&
      this.props.condition &&
      !this.context.matchPageParams(
        this.props.condition,
        `PageModule[${this.moduleName}]`,
      )
    ) {
      return null
    }

    return (
      <div className={cn('page-module', this.props.className)}>
        {this.renderContent()}
      </div>
    )
  }

  render() {
    return (
      <LayoutContext.Consumer>
        {(layoutContext) => this.renderContext(layoutContext)}
      </LayoutContext.Consumer>
    )
  }
}
