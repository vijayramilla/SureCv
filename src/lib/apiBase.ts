/** Production API host (Railway custom domain). */
export const PRODUCTION_API_URL = 'https://api.surecv.in'

/**
 * Backend base URL for /api/* calls.
 * - VITE_API_URL when set (build-time)
 * - https://api.surecv.in when the app runs on surecv.in
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
      return PRODUCTION_API_URL
    }
  }

  return 'http://localhost:3001'
}
