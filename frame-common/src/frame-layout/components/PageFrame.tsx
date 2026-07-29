import React from 'react'
import {
  PageContext,
  createPageContextValue,
  type PageContextType,
} from '../contexts'
import type { PageParams, SearchParams } from '../types'
import { cn } from '../cn'

export interface PageFrameProps {
  className?: string
  children?: React.ReactNode
  title?: string
}

interface PageFrameState {
  pageParams: PageParams
  pageSearch: SearchParams
  loading: Record<string, boolean>
  paramSwitcherRegistry: Record<string, string>
}

/**
 * Minimal app chrome provider — supplies PageContext for SectionWrapper / PageModule.
 * No rjs-admin / rjs-frame dependency.
 */
export abstract class PageFrame<
  T extends PageFrameProps = PageFrameProps,
  S extends PageFrameState = PageFrameState,
> extends React.Component<T, S> {
  updateState(state: Partial<S>) {
    this.setState((prev) => ({ ...prev, ...state }))
  }

  constructor(props: T) {
    super(props)
    this.state = {
      pageParams: {},
      pageSearch: {},
      loading: {},
      paramSwitcherRegistry: {},
    } as S
  }

  componentDidMount() {
    if (this.props.title && typeof document !== 'undefined') {
      document.title = this.props.title
    }
  }

  componentDidUpdate(prevProps: PageFrameProps) {
    if (prevProps.title !== this.props.title && this.props.title) {
      if (typeof document !== 'undefined') {
        document.title = this.props.title
      }
    }
  }

  private registerParamSwitcher = (paramKey: string, moduleId: string) => {
    this.updateState({
      paramSwitcherRegistry: {
        ...this.state.paramSwitcherRegistry,
        [paramKey]: moduleId,
      },
    } as unknown as Partial<S>)
  }

  private unregisterParamSwitcher = (paramKey: string, moduleId: string) => {
    if (this.state.paramSwitcherRegistry[paramKey] !== moduleId) return null
    const next = { ...this.state.paramSwitcherRegistry }
    delete next[paramKey]
    this.updateState({
      paramSwitcherRegistry: next,
    } as unknown as Partial<S>)
    return moduleId
  }

  private getParamSwitcher = (paramKey: string) =>
    this.state.paramSwitcherRegistry[paramKey] || null

  abstract renderContent(): React.ReactNode

  render() {
    const pageContext: PageContextType = createPageContextValue(
      this.state.pageParams,
      this.state.pageSearch,
      {
        setLoading: (loadingKey, loadingValue) => {
          const loading =
            typeof loadingValue === 'boolean'
              ? loadingValue
              : !this.state.loading[loadingKey]
          this.updateState({
            loading: { ...this.state.loading, [loadingKey]: loading },
          } as Partial<S>)
        },
        getLoading: (loadingKey) => this.state.loading[loadingKey] || false,
        registerParamSwitcher: this.registerParamSwitcher,
        unregisterParamSwitcher: this.unregisterParamSwitcher,
        getParamSwitcher: this.getParamSwitcher,
        setPageParams: (params) => {
          this.updateState({
            pageParams: { ...this.state.pageParams, ...params },
          } as Partial<S>)
        },
      },
    )

    return (
      <div className={cn('page-layout', this.props.className)}>
        <PageContext.Provider value={pageContext}>
          {this.renderContent()}
        </PageContext.Provider>
      </div>
    )
  }
}
