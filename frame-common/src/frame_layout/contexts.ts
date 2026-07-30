import { createContext, useContext, type ReactNode } from 'react'
import type {
  ModuleState,
  PageParams,
  ParamSpec,
  SearchParams,
} from './types'
import { matchPageParams as matchPageParamsFn } from './matchPageParams'

/**
 * Read-only page snapshot for layout / condition matching.
 * Mutations live on the store: `updatePageParams`, `updateModuleState`, …
 */
export interface PageContextType {
  pageParams: PageParams
  pageSearch: SearchParams
  moduleState: ModuleState
  setLoading: (loadingKey: string, loadingValue?: boolean) => void
  getLoading: (loadingKey: string) => boolean
  registerParamSwitcher: (paramKey: string, moduleId: string) => void
  unregisterParamSwitcher: (paramKey: string, moduleId: string) => string | null
  getParamSwitcher: (paramKey: string) => string | null
  matchPageParams: (
    paramSpec: ParamSpec | undefined,
    componentName: string,
  ) => boolean
}

export interface LayoutContextType {
  modules: Record<string, ReactNode[]>
  sectionClasses: Record<string, string>
}

export const PageContext = createContext<PageContextType | null>(null)
export const LayoutContext = createContext<LayoutContextType | null>(null)

export const usePageContext = () => {
  const context = useContext(PageContext)
  if (!context) {
    throw new Error('usePageContext must be used within a PageContext provider')
  }
  return context
}

export const useLayoutContext = () => {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayoutContext must be used within a PageLayout')
  }
  return context
}

/** Build a PageContext value from current app state slices. */
export function createPageContextValue(
  pageParams: PageParams,
  pageSearch: SearchParams,
  moduleState: ModuleState = {},
  extras: Partial<
    Pick<
      PageContextType,
      | 'setLoading'
      | 'getLoading'
      | 'registerParamSwitcher'
      | 'unregisterParamSwitcher'
      | 'getParamSwitcher'
    >
  > = {},
): PageContextType {
  return {
    pageParams,
    pageSearch,
    moduleState,
    setLoading: extras.setLoading ?? (() => {}),
    getLoading: extras.getLoading ?? (() => false),
    registerParamSwitcher: extras.registerParamSwitcher ?? (() => {}),
    unregisterParamSwitcher: extras.unregisterParamSwitcher ?? (() => null),
    getParamSwitcher: extras.getParamSwitcher ?? (() => null),
    matchPageParams: (paramSpec, componentName) =>
      matchPageParamsFn(paramSpec, pageParams, componentName),
  }
}
