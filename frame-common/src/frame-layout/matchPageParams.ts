import type { ParamMatcherConfig, ParamSpec } from './types'

function isParamMatcherConfig(value: unknown): value is ParamMatcherConfig {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('$absent' in value || '$exists' in value)
  )
}

/**
 * Match page params against a condition spec.
 * Empty / undefined spec → always match.
 */
export function matchParams(
  paramSpec: ParamSpec | null | undefined,
  paramValues: Record<string, unknown>,
  componentName = 'Component',
): boolean {
  if (paramSpec == null) return true

  if (typeof paramSpec === 'function') {
    try {
      return paramSpec(paramValues)
    } catch (error) {
      console.error(`[${componentName}] Error in matchParams function:`, error)
      return false
    }
  }

  if (typeof paramSpec === 'object') {
    const entries = Object.entries(paramSpec)
    if (entries.length === 0) return true

    for (const [key, matcher] of entries) {
      const paramValue = paramValues[key]
      const paramExists = key in paramValues

      if (isParamMatcherConfig(matcher)) {
        if (matcher.$absent === true) {
          if (paramExists) return false
          continue
        }
        if (matcher.$exists === true) {
          if (!paramExists) return false
          continue
        }
        continue
      }

      if (!paramExists) return false

      if (typeof matcher === 'boolean') {
        if (paramValue !== matcher) return false
      } else if (typeof matcher === 'string') {
        if (paramValue !== matcher) return false
      } else if (matcher instanceof RegExp) {
        if (!matcher.test(String(paramValue))) return false
      }
    }

    return true
  }

  console.warn(`[${componentName}] Unknown matchParams type:`, typeof paramSpec)
  return false
}

export function matchPageParams(
  paramSpec: ParamSpec | null | undefined,
  pageParams: Record<string, unknown>,
  componentName: string,
): boolean {
  return matchParams(paramSpec, pageParams, componentName)
}
