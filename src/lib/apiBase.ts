/** Separate API subdomain (optional split deploy). */
export const PRODUCTION_API_URL = 'https://api.surecv.in'

/**
 * Backend base URL for /api/* calls.
 * - VITE_API_URL when set at build time
 * - Same origin on surecv.in (Railway full-stack: site + API on one domain)
 * - https://api.surecv.in if VITE_API_URL points there
 * - http://localhost:3001 for local dev
 */
export function getApiBase(): string {
  const configured = import.meta.env.VITE_API_URL as string | undefined
  if (configured?.trim()) {
    return configured.trim().replace(/\/$/, '')
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'surecv.in' || host === 'www.surecv.in') {
      return window.location.origin
    }
  }

  return 'http://localhost:3001'
}
