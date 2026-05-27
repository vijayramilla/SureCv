import { fetchUrlViaScraperApi } from './scraperApi'

function cleanJobText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, 8000)
}

function parseHtmlToText(html: string): string {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  doc
    .querySelectorAll('script, style, nav, footer, header, noscript, iframe')
    .forEach((el) => el.remove())
  return doc.body?.innerText || doc.body?.textContent || ''
}

async function fetchViaProxy(url: string): Promise<string> {
  const attempts = [
    async () => {
      const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
      const res = await fetch(proxy, { signal: AbortSignal.timeout(25000) })
      if (!res.ok) throw new Error('allorigins failed')
      const data = (await res.json()) as { contents?: string }
      if (!data.contents) throw new Error('empty')
      return parseHtmlToText(data.contents)
    },
    async () => {
      const proxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
      const res = await fetch(proxy, { signal: AbortSignal.timeout(25000) })
      if (!res.ok) throw new Error('allorigins raw failed')
      const html = await res.text()
      return parseHtmlToText(html)
    },
    async () => {
      const proxy = `https://corsproxy.io/?${encodeURIComponent(url)}`
      const res = await fetch(proxy, { signal: AbortSignal.timeout(25000) })
      if (!res.ok) throw new Error('corsproxy failed')
      const html = await res.text()
      return parseHtmlToText(html)
    },
  ]

  let lastError: unknown
  for (const attempt of attempts) {
    try {
      const text = cleanJobText(await attempt())
      if (text.length >= 40) return text
    } catch (e) {
      lastError = e
    }
  }
  throw lastError instanceof Error ? lastError : new Error('All proxies failed')
}

/** Fetch job posting text — Puppeteer API first, then CORS proxies. */
export async function fetchJobDescriptionFromUrl(url: string): Promise<string> {
  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw new Error('Please enter a valid http(s) URL')
  }

  const apiResult = await fetchUrlViaScraperApi(trimmed)
  if (apiResult?.text && apiResult.text.length >= 40) {
    return apiResult.text
  }

  const proxyText = await fetchViaProxy(trimmed)
  if (proxyText.length < 40) {
    throw new Error('Could not extract enough text from this URL. Paste manually.')
  }
  return proxyText
}
