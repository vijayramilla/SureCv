const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

  return response.json()
  // Returns: { atsBefore, atsAfter, pdfUrl, scoreDimensions,
  //            missingKeywords, addedKeywords, recruiterTips,
  //            candidateName, creditsUsed, creditsRemaining }
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

  return response.json()
  // Returns: { pdfUrl, coverLetterText, creditsUsed }
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
  pdfUrl: string
  pdfExpiresAt: string
  runId: string
  creditsUsed: number
  creditsRemaining: number
  candidateName: string
}

export interface CoverLetterResponse {
  success: boolean
  pdfUrl: string
  pdfExpiresAt: string
  runId: string
  creditsUsed: number
  coverLetterText: string
}

export interface ParseResponse {
  success: boolean
  parsedData: Record<string, any>
  resumeText: string
  runId: string
}
