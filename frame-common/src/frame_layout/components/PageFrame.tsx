import React from 'react'
import {
  PageContext,
  createPageContextValue,
  type PageContextType,
} from '../contexts'
import type { ModuleState, PageParams, SearchParams } from '../types'
import { cn } from '../cn'
import {
  getAppState,
  subscribeToAppState,
  syncFromBrowserLocation,
} from '../stores/appStateStore'

export interface PageFrameProps {
  className?: string
  children?: React.ReactNode
  title?: string
}

interface PageFrameState {
  pageParams: PageParams
  pageSearch: SearchParams
  moduleState: ModuleState
  loading: Record<string, boolean>
  paramSwitcherRegistry: Record<string, string>
}

/**
 * App chrome provider — supplies PageContext for SectionWrapper / PageModule.
 * Syncs pageParams / pageSearch / moduleState from frame_layout appStateStore.
 * URL: pageParams ↔ hash, pageSearch ↔ query (see urlUtils).
 */
export abstract class PageFrame<
  T extends PageFrameProps = PageFrameProps,
  S extends PageFrameState = PageFrameState,
> extends React.Component<T, S> {
  private unsubscribeAppState?: () => void

  updateState(state: Partial<S>) {
    this.setState((prev) => ({ ...prev, ...state }))
  }

  constructor(props: T) {
    super(props)
    const { pageParams, pageSearch, moduleState } = getAppState()
    this.state = {
      pageParams,
      pageSearch,
      moduleState,
      loading: {},
      paramSwitcherRegistry: {},
    } as S
  }

  private onBrowserNavigation = () => {
    syncFromBrowserLocation()
  }

  componentDidMount() {
    if (this.props.title && typeof document !== 'undefined') {
      document.title = this.props.title
    }

    // Re-hydrate in case the store was created before navigation / HMR
    syncFromBrowserLocation()

    this.unsubscribeAppState = subscribeToAppState((appState) => {
      this.updateState({
        pageParams: appState.pageParams,
        pageSearch: appState.pageSearch,
        moduleState: appState.moduleState,
      } as Partial<S>)
    })

    window.addEventListener('popstate', this.onBrowserNavigation)
    window.addEventListener('hashchange', this.onBrowserNavigation)
  }

  componentDidUpdate(prevProps: PageFrameProps) {
    if (prevProps.title !== this.props.title && this.props.title) {
      if (typeof document !== 'undefined') {
        document.title = this.props.title
      }
    }
  }

  componentWillUnmount() {
    this.unsubscribeAppState?.()
    window.removeEventListener('popstate', this.onBrowserNavigation)
    window.removeEventListener('hashchange', this.onBrowserNavigation)
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
      this.state.moduleState,
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
