import { getApiBase } from './apiBase'

const API_BASE = getApiBase()

// ─── OPTIMIZE RESUME ──────────────────────────────────
export async function optimizeResume(
  resumeText: string,
  jobDescription: string,
  userInstructions = '',
  resumeLength = 'auto'
) {
  const response = await fetch(`${API_BASE}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText,
      jobDescription,
      userInstructions,
      resumeLength,
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Optimization failed')
  }

  const data = await response.json()
  const rewritten =
    (typeof data.rewrittenResume === 'string' && data.rewrittenResume) ||
    (typeof data.optimizedResume === 'string' && data.optimizedResume) ||
    ''

  return {
    ...data,
    success: data.success ?? true,
    rewrittenResume: rewritten,
    optimizedResume: rewritten,
    pdfUrl: data.pdfUrl ?? null,
    pdfExpiresAt: data.pdfExpiresAt ?? null,
    creditsUsed: data.creditsUsed ?? 0,
    creditsRemaining: data.creditsRemaining ?? null,
  }
}

// ─── GENERATE COVER LETTER ────────────────────────────
export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  jobTitle = '',
  companyName = '',
  tone = 'professional'
) {
  const response = await fetch(`${API_BASE}/api/cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText,
      jobDescription,
      jobTitle,
      companyName,
      tone,
    })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Cover letter failed')
  }

  const data = await response.json()
  return {
    ...data,
    success: data.success ?? true,
    coverLetterText:
      (typeof data.coverLetter === 'string' && data.coverLetter) ||
      (typeof data.coverLetterText === 'string' && data.coverLetterText) ||
      '',
    pdfUrl: data.pdfUrl ?? null,
  }
}

// ─── PARSE PDF RESUME ─────────────────────────────────
export async function parseResumePDF(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/api/parse-resume`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Parse failed')
  }

  return response.json()
  // Returns: { parsedData, resumeText, runId }
}

export interface OptimizeResponse {
  success: boolean
  atsBefore: number
  atsAfter: number
  scoreDimensions: {
    keywordMatch: number
    formatScore: number
    actionVerbScore: number
    quantifiedBullets: number
    sectionCompleteness: number
  }
  scoreLabel: string
  industryDetected: string
  missingKeywords: string[]
  addedKeywords: string[]
  bulletsRewritten: number
  metricsAdded: number
  recruiterTips: string[]
  rewrittenResume: string
  optimizedResume: string
  weakVerbsReplaced?: { original: string; replacement: string }[]
  coverLetterPoints?: string[]
  pdfUrl: string | null
  pdfExpiresAt: string | null
  creditsUsed: number
  creditsRemaining: number | null
  candidateName: string
}

export interface CoverLetterResponse {
  success: boolean
  coverLetter?: string
  coverLetterText: string
  wordCount?: number
  keywordsUsed?: string[]
  pdfUrl: string | null
  pdfExpiresAt?: string | null
  runId?: string
  creditsUsed?: number
}

export interface ParseResponse {
  success: boolean
  parsedData: Record<string, any>
  resumeText: string
  runId: string
}
