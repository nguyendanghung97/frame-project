import type {
  AppState,
  ModuleState,
  ModuleStateBag,
  PageParams,
  SearchParams,
} from '../types'
import {
  parseBrowserLocation,
  updateBrowserLocation,
} from '../utils/urlUtils'

type Listener = (state: AppState) => void

const emptyState = (): AppState => ({
  pageParams: {},
  pageSearch: {},
  moduleState: {},
})

function hydrateFromLocation(): AppState {
  const base = emptyState()
  if (typeof window === 'undefined') return base
  const parsed = parseBrowserLocation(window.location)
  return {
    ...base,
    pageParams: parsed.pageParams,
    pageSearch: parsed.pageSearch,
  }
}

let appState: AppState = hydrateFromLocation()
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) {
    listener(appState)
  }
}

function updateAppState(
  updates: Partial<AppState>,
  options: { syncUrl?: boolean } = {},
): AppState {
  const { syncUrl = true } = options
  appState = { ...appState, ...updates }
  emit()

  if (
    syncUrl &&
    ('pageParams' in updates || 'pageSearch' in updates)
  ) {
    updateBrowserLocation(appState)
  }

  return appState
}

/**
 * Merge updates into a record, optionally removing keys first.
 * Drops empty / null / undefined values (same idea as rjs-frame).
 */
function mergeState(
  state: Record<string, unknown>,
  stateUpdates: Record<string, unknown>,
  unsetKeys: (string | RegExp)[] = [],
): Record<string, unknown> {
  let currentState = state

  if (unsetKeys.length > 0) {
    const shouldUnset = (param: string) =>
      unsetKeys.some((unset) =>
        unset instanceof RegExp ? unset.test(param) : param === unset,
      )

    currentState = Object.fromEntries(
      Object.entries(currentState).filter(([key]) => !shouldUnset(key)),
    )
  }

  return Object.fromEntries(
    Object.entries({ ...currentState, ...stateUpdates }).filter(
      ([key, value]) =>
        value !== undefined &&
        value !== null &&
        value !== '' &&
        key !== undefined &&
        key !== null &&
        key !== '',
    ),
  )
}

export function getAppState(): AppState {
  return appState
}

export function subscribeToAppState(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/**
 * Merge UI state for one named module (preserves other modules).
 * Adapted from rjs-frame `updateModuleState`.
 */
export function updateModuleState(
  moduleName: string,
  stateUpdates: Partial<ModuleStateBag>,
): ModuleState {
  const currentModule = appState.moduleState[moduleName] ?? {}
  const nextModuleState: ModuleState = {
    ...appState.moduleState,
    [moduleName]: {
      ...currentModule,
      ...stateUpdates,
    },
  }
  updateAppState({ moduleState: nextModuleState })
  return nextModuleState
}

export function getModuleState(moduleName: string): ModuleStateBag {
  return appState.moduleState[moduleName] ?? {}
}

/**
 * Merge page params; optional `unsetKeys` removes keys before merge.
 * Syncs to URL hash (e.g. `{ patient: "Jane" }` → `#patient:Jane`).
 */
export function updatePageParams(
  paramUpdates: Partial<PageParams>,
  unsetKeys: (string | RegExp)[] = [],
): PageParams {
  const next = mergeState(appState.pageParams, paramUpdates, unsetKeys)
  updateAppState({ pageParams: next })
  return next
}

export function updatePageSearch(
  paramUpdates: Partial<SearchParams>,
  unsetKeys: (string | RegExp)[] = [],
): SearchParams {
  const next = mergeState(
    appState.pageSearch,
    paramUpdates,
    unsetKeys,
  ) as SearchParams
  updateAppState({ pageSearch: next })
  return next
}

/** Read hash/search into store without writing history (back/forward). */
export function syncFromBrowserLocation(): AppState {
  if (typeof window === 'undefined') return appState
  const parsed = parseBrowserLocation(window.location)
  return updateAppState(
    {
      pageParams: parsed.pageParams,
      pageSearch: parsed.pageSearch,
    },
    { syncUrl: false },
  )
}

/** Test / HMR helper — reset store to empty (clears URL fragments/search). */
export function resetAppState(): AppState {
  return updateAppState(emptyState())
}
