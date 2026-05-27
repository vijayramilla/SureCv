export interface ParsedApiError {
  userMessage: string
  retryAfterSeconds?: number
  code?: 'rate_limit' | 'auth' | 'timeout' | 'busy' | 'config' | 'parse' | 'unknown'
}

function formatWaitTime(seconds: number): string {
  const s = Math.max(1, Math.ceil(seconds))
  if (s < 60) return `${s} second${s === 1 ? '' : 's'}`
  const minutes = Math.ceil(s / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'}`
  const hours = Math.ceil(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'}`
}

/** Parse Retry-After header (seconds or HTTP-date). */
export function parseRetryAfterHeader(value: string | null): number | undefined {
  if (!value) return undefined
  const asNum = Number(value)
  if (!Number.isNaN(asNum) && asNum > 0) return Math.ceil(asNum)
  const asDate = Date.parse(value)
  if (!Number.isNaN(asDate)) {
    const diff = Math.ceil((asDate - Date.now()) / 1000)
    return diff > 0 ? diff : undefined
  }
  return undefined
}

/** Parse Google Gemini RetryInfo retryDelay (e.g. "34s"). */
export function parseGeminiRetryDelay(details: unknown): number | undefined {
  if (!Array.isArray(details)) return undefined
  for (const item of details) {
    const d = item as { '@type'?: string; retryDelay?: string }
    if (d?.retryDelay && typeof d.retryDelay === 'string') {
      const match = d.retryDelay.match(/^(\d+(?:\.\d+)?)s?$/i)
      if (match) return Math.ceil(parseFloat(match[1]))
    }
  }
  return undefined
}

export function parseApiError(error: unknown): ParsedApiError {
  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  const retryFromMessage =
    message.match(/retry (?:in|after)\s*(\d+(?:\.\d+)?)\s*s/i)?.[1] ||
    message.match(/wait\s*(\d+(?:\.\d+)?)\s*s/i)?.[1] ||
    message.match(/(\d+)\s*seconds?\s*(?:and try|before)/i)?.[1]

  const retrySeconds = retryFromMessage
    ? Math.ceil(parseFloat(retryFromMessage))
    : undefined

  if (
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('resource_exhausted') ||
    lower.includes('too many requests')
  ) {
    const wait = retrySeconds ?? 60
    return {
      code: 'rate_limit',
      retryAfterSeconds: wait,
      userMessage: `Usage limit reached. Please wait ${formatWaitTime(wait)}, then try again.`,
    }
  }

  if (lower.includes('401') || lower.includes('invalid api key') || lower.includes('authentication')) {
    return {
      code: 'auth',
      userMessage: 'Service authentication failed. Please contact support.',
    }
  }

  if (
    lower.includes('not configured') ||
    lower.includes('api key is not') ||
    lower.includes('missing api')
  ) {
    return {
      code: 'config',
      userMessage: 'SureCV Intelligence is not fully configured. Please contact support.',
    }
  }

  if (lower.includes('503') || lower.includes('overloaded') || lower.includes('unavailable')) {
    const wait = retrySeconds ?? 45
    return {
      code: 'busy',
      retryAfterSeconds: wait,
      userMessage: `Our engine is busy. Please wait ${formatWaitTime(wait)}, then try again.`,
    }
  }

  if (lower.includes('timed out') || lower.includes('timeout') || lower.includes('abort')) {
    return {
      code: 'timeout',
      retryAfterSeconds: 15,
      userMessage: 'Request timed out. Please wait 15 seconds and try again.',
    }
  }

  if (lower.includes('parse') || lower.includes('json') || lower.includes('invalid response')) {
    return {
      code: 'parse',
      userMessage: 'We could not process the engine response. Please try again in a moment.',
    }
  }

  if (message.length > 0 && message.length < 200 && !lower.includes('temporarily unavailable')) {
    return { code: 'unknown', userMessage: message }
  }

  return {
    code: 'unknown',
    userMessage: 'Resume optimization failed. Please try again in a moment.',
  }
}

/** True when another API key or provider should be tried automatically. */
export function isRetryableApiError(error: unknown): boolean {
  const parsed = parseApiError(error)
  if (
    parsed.code === 'rate_limit' ||
    parsed.code === 'busy' ||
    parsed.code === 'timeout' ||
    parsed.code === 'auth' ||
    parsed.code === 'parse'
  ) {
    return true
  }

  const message = error instanceof Error ? error.message : String(error)
  const lower = message.toLowerCase()

  return (
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('limit reached') ||
    lower.includes('usage limit') ||
    lower.includes('too many requests') ||
    lower.includes('resource_exhausted') ||
    lower.includes('tokens per') ||
    lower.includes('capacity') ||
    lower.includes('overloaded') ||
    lower.includes('temporarily busy') ||
    lower.includes('timed out') ||
    lower.includes('timeout') ||
    lower.includes('api error') ||
    lower.includes('empty response') ||
    lower.includes('503') ||
    lower.includes('429') ||
    lower.includes('502') ||
    lower.includes('could not parse')
  )
}

/** User/input validation — do not switch providers. */
export function isUserInputValidationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return (
    message.includes('too short') ||
    message.includes('Minimum') && message.includes('needed') ||
    message.includes('not configured') && message.includes('Add VITE')
  )
}

/** Pick the most helpful error when multiple providers failed. */
export function mergeProviderErrors(errors: unknown[]): ParsedApiError {
  const parsed = errors.map(parseApiError)

  const rateLimit = parsed.find((e) => e.code === 'rate_limit')
  if (rateLimit) return rateLimit

  const busy = parsed.find((e) => e.code === 'busy')
  if (busy) return busy

  const timeout = parsed.find((e) => e.code === 'timeout')
  if (timeout) return timeout

  const auth = parsed.find((e) => e.code === 'auth' || e.code === 'config')
  if (auth) return auth

  const parse = parsed.find((e) => e.code === 'parse')
  if (parse) return parse

  return (
    parsed[0] ?? {
      code: 'unknown',
      userMessage: 'Resume optimization is temporarily unavailable. Please try again in a moment.',
    }
  )
}
