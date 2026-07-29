import { createContext, useContext, type ReactNode } from 'react'
import type { PageParams, ParamSpec, SearchParams } from './types'
import { matchPageParams as matchPageParamsFn } from './matchPageParams'

export interface PageContextType {
  pageParams: PageParams
  pageSearch: SearchParams
  setLoading: (loadingKey: string, loadingValue?: boolean) => void
  getLoading: (loadingKey: string) => boolean
  registerParamSwitcher: (paramKey: string, moduleId: string) => void
  unregisterParamSwitcher: (paramKey: string, moduleId: string) => string | null
  getParamSwitcher: (paramKey: string) => string | null
  matchPageParams: (
    paramSpec: ParamSpec | undefined,
    componentName: string,
  ) => boolean
  setPageParams: (params: PageParams) => void
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

/** Build a PageContext value from local page params (no rjs-frame). */
export function createPageContextValue(
  pageParams: PageParams,
  pageSearch: SearchParams,
  extras: Partial<
    Pick<
      PageContextType,
      | 'setLoading'
      | 'getLoading'
      | 'registerParamSwitcher'
      | 'unregisterParamSwitcher'
      | 'getParamSwitcher'
      | 'setPageParams'
    >
  > = {},
): PageContextType {
  return {
    pageParams,
    pageSearch,
    setLoading: extras.setLoading ?? (() => {}),
    getLoading: extras.getLoading ?? (() => false),
    registerParamSwitcher: extras.registerParamSwitcher ?? (() => {}),
    unregisterParamSwitcher: extras.unregisterParamSwitcher ?? (() => null),
    getParamSwitcher: extras.getParamSwitcher ?? (() => null),
    setPageParams: extras.setPageParams ?? (() => {}),
    matchPageParams: (paramSpec, componentName) =>
      matchPageParamsFn(paramSpec, pageParams, componentName),
  }
}
