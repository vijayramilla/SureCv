// ─── FRONTEND CALLS BACKEND (NETLIFY FUNCTIONS) ─────
// All NVIDIA API calls now happen securely on the backend
// Frontend never calls NVIDIA directly or exposes the API key

export interface AnalysisResult {
  score: number;
  missingKeywords: string[];
  rewrittenResume: string;
  atsBefore?: number;
  atsAfter?: number;
  scoreDimensions?: Record<string, number>;
  scoreLabel?: string;
  industryDetected?: string;
  addedKeywords?: string[];
  weakVerbsReplaced?: Array<{ original: string; replacement: string }>;
  bulletsRewritten?: number;
  metricsAdded?: number;
  recruiterTips?: string[];
  coverLetterPoints?: string[];
}

// ─── CALL BACKEND FUNCTION ───────────────────────────
async function callOptimizeBackend(
  resumeText: string,
  jobDescription: string,
  userInstructions: string = '',
  resumeLength: string = 'auto'
): Promise<AnalysisResult> {
  const backendUrl = '/.netlify/functions/optimize'

  console.log('[Frontend] Calling backend for optimization...')

  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resumeText,
      jobDescription,
      userInstructions,
      resumeLength
    })
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('[Frontend] Backend error:', err)
    throw new Error(`Backend error ${response.status}: ${err}`)
  }

  const result = await response.json()
  console.log('[Frontend] Backend response received')

  return result
}

// ─── MAIN ANALYZE FUNCTION ───────────────────────────
export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  userInstructions: string = '',
  resumeLength: string = 'auto'
): Promise<AnalysisResult> {
  return await callOptimizeBackend(resumeText, jobDescription, userInstructions, resumeLength)
}

// ─── STUB FUNCTIONS FOR COMPATIBILITY ─────────────────
// These were previously used but now handled by backend
export async function generateCoverLetter(
  _resumeText: string,
  _jobDescription: string,
  _jobTitle?: string,
  _companyName?: string
): Promise<string> {
  // Cover letter is now generated via analyzeResume result
  throw new Error('Use aiOptimization.ts for cover letter generation')
}

export async function improveBullet(
  bullet: string,
  _jobTitle?: string
): Promise<string> {
  // Not used in production flow
  return bullet
}

export async function improveSummary(
  summary: string,
  _jobTitle?: string
): Promise<string> {
  // Not used in production flow
  return summary
}
