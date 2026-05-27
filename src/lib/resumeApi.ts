import type { ParsedResume } from './parseResumeText'
import type { AtsScoreData } from './atsScoreTypes'
import { computeFallbackAtsScore } from './fallbackAtsScore'

const API_BASE = (import.meta.env.VITE_SCRAPER_API_URL as string | undefined)?.replace(
  /\/$/,
  ''
) ?? ''

function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

export async function generateResumePdf(
  resumeData: ParsedResume,
  theme: 'dark' | 'light' = 'dark'
): Promise<Blob> {
  const res = await fetch(apiUrl('/api/generate-resume-pdf'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeData, theme }),
    signal: AbortSignal.timeout(90000),
  })

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(err.error || 'PDF generation failed')
  }

  return res.blob()
}

export async function fetchResumePreviewPng(
  resumeData: ParsedResume,
  theme: 'dark' | 'light' = 'dark'
): Promise<string> {
  const res = await fetch(apiUrl('/api/preview-resume-png'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeData, theme }),
    signal: AbortSignal.timeout(90000),
  })

  if (!res.ok) {
    throw new Error('Preview generation failed')
  }

  const blob = await res.blob()
  return URL.createObjectURL(blob)
}

export async function calculateAtsScore(
  resumeText: string,
  jobDescription: string,
  optimizedResumeText?: string
): Promise<AtsScoreData> {
  try {
    const res = await fetch(apiUrl('/api/calculate-ats-score'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobDescription, optimizedResumeText }),
      signal: AbortSignal.timeout(60000),
    })

    if (!res.ok) {
      throw new Error('ATS API unavailable')
    }

    const data = (await res.json()) as AtsScoreData
    return { ...data, source: 'gemini' }
  } catch {
    return computeFallbackAtsScore(resumeText, jobDescription, optimizedResumeText)
  }
}

/** Score original + optimized resumes and merge into one AtsScoreData object. */
export async function calculateFullAtsScore(
  originalResume: string,
  optimizedResume: string,
  jobDescription: string
): Promise<AtsScoreData> {
  try {
    const res = await fetch(apiUrl('/api/calculate-ats-score'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: originalResume,
        jobDescription,
        optimizedResumeText: optimizedResume,
      }),
      signal: AbortSignal.timeout(90000),
    })

    if (!res.ok) throw new Error('ATS failed')

    const data = (await res.json()) as AtsScoreData
    return { ...data, source: 'gemini' }
  } catch {
    return computeFallbackAtsScore(originalResume, jobDescription, optimizedResume)
  }
}
