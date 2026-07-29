import type { AppState, PageParams, SearchParams } from '../types'

/** First char: letter/digit/underscore; then also `.` and `-`. */
const FRAGMENT_NAME_PATTERN = /^[a-zA-Z0-9_]([a-zA-Z0-9_.-]*)?$/

export interface ParsedUrl {
  pagePath: string
  pageParams: PageParams
  pageSearch: SearchParams
}

export function isValidFragmentName(name: string): boolean {
  return FRAGMENT_NAME_PATTERN.test(name)
}

function parseSearchParams(search: string): SearchParams {
  const params: SearchParams = {}
  new URLSearchParams(search).forEach((value, key) => {
    params[key] = value
  })
  return params
}

/**
 * Parse URL hash fragments into pageParams (rjs-frame format).
 * - `flag` → `{ flag: true }`
 * - `flag:` → `{ flag: false }`
 * - `key:value` → `{ key: "value" }`
 * Segments separated by `/`.
 */
export function parseUrlFragments(fragments: string): PageParams {
  let hash = fragments
  if (hash.startsWith('#')) hash = hash.slice(1)
  if (!hash) return {}

  const params: PageParams = {}

  for (const fragment of hash.split('/').filter(Boolean)) {
    const colonIndex = fragment.indexOf(':')
    if (colonIndex === -1) {
      if (isValidFragmentName(fragment)) params[fragment] = true
      continue
    }
    const name = fragment.slice(0, colonIndex)
    const valueString = fragment.slice(colonIndex + 1)
    if (!isValidFragmentName(name)) continue
    if (valueString === '') {
      params[name] = false
      continue
    }
    try {
      params[name] = decodeURIComponent(valueString)
    } catch {
      params[name] = valueString
    }
  }

  return params
}

/**
 * Build hash from pageParams.
 * `{ debug: true }` → `#debug`, `{ debug: false }` → `#debug:`, `{ id: "a" }` → `#id:a`
 */
export function buildUrlFragments(params: PageParams): string {
  const fragments = Object.entries(params)
    .map(([key, value]) => {
      if (!isValidFragmentName(key)) return null
      if (value === true) return key
      if (value === false) return `${key}:`
      if (typeof value === 'string' && value !== '') {
        return `${key}:${encodeURIComponent(value)}`
      }
      if (typeof value === 'number' && Number.isFinite(value)) {
        return `${key}:${encodeURIComponent(String(value))}`
      }
      return null
    })
    .filter(Boolean)
    .join('/')

  return fragments ? `#${fragments}` : ''
}

function buildSearch(pageSearch: SearchParams): string {
  const searchParams = new URLSearchParams()
  Object.entries(pageSearch).forEach(([key, value]) => {
    if (key) searchParams.set(key, value)
  })
  const params = searchParams.toString()
  return params ? `?${params}` : ''
}

export function parseBrowserLocation(windowLocation: Location): ParsedUrl {
  return {
    pagePath: windowLocation.pathname,
    pageParams: parseUrlFragments(windowLocation.hash),
    pageSearch: parseSearchParams(windowLocation.search),
  }
}

/**
 * Write pageParams → hash and pageSearch → query, keeping pathname.
 * pushState when hash changes; replaceState for search-only changes.
 */
export function updateBrowserLocation(appState: AppState): void {
  if (typeof window === 'undefined') return

  const { pathname, hash, search } = window.location
  const newPathname = pathname.replace(/^\/+/, '/') || '/'
  const newSearch = buildSearch(appState.pageSearch)
  const newHash = buildUrlFragments(appState.pageParams)
  const newUrl = newPathname + newSearch + newHash
  const currentUrl = pathname + search + hash

  if (newUrl === currentUrl) return

  const historyState = {
    pagePath: newPathname,
    pageParams: appState.pageParams,
    pageSearch: appState.pageSearch,
  }

  if (pathname !== newPathname || newHash !== hash) {
    window.history.pushState(historyState, '', newUrl)
  } else {
    window.history.replaceState(historyState, '', newUrl)
  }
}
