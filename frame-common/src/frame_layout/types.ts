export type ParamMatcherConfig = {
  $absent?: true
  $exists?: true
}

export type ParamMatcher = boolean | string | RegExp | ParamMatcherConfig

export type ParamSpec =
  | Record<string, ParamMatcher>
  | ((pageParams: Record<string, unknown>) => boolean)

export type PageParams = Record<string, unknown>
export type SearchParams = Record<string, string>

/** Per-module keyed bag of arbitrary UI state. */
export type ModuleStateBag = Record<string, unknown>

/** All modules: moduleName → state bag. */
export type ModuleState = Record<string, ModuleStateBag>

export interface AppState {
  pageParams: PageParams
  pageSearch: SearchParams
  moduleState: ModuleState
}
