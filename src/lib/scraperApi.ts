const API_BASE = (import.meta.env.VITE_SCRAPER_API_URL as string | undefined)?.replace(
  /\/$/,
  ''
) ?? ''

function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export async function isScraperApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/health'), { signal: AbortSignal.timeout(2500) })
    return res.ok
  } catch {
    return false
  }
}

export interface PdfExtractResponse {
  text: string
  pageCount: number
  wordCount: number
  success: boolean
}

export async function extractPdfViaScraperApi(
  file: File
): Promise<PdfExtractResponse | null> {
  const form = new FormData()
  form.append('file', file)

  try {
    const res = await fetch(apiUrl('/api/extract-pdf'), {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(err.error || `PDF API error ${res.status}`)
    }

    return (await res.json()) as PdfExtractResponse
  } catch {
    return null
  }
}

export interface UrlFetchResponse {
  text: string
  wordCount: number
  success: boolean
}

export async function fetchUrlViaScraperApi(
  url: string
): Promise<UrlFetchResponse | null> {
  try {
    const res = await fetch(apiUrl('/api/fetch-url'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string }
      throw new Error(err.error || `URL API error ${res.status}`)
    }

    return (await res.json()) as UrlFetchResponse
  } catch {
    return null
  }
}
