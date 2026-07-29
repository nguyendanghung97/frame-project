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
