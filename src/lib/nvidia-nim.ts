// ─── GROQ/GEMINI API CALLS ─────
// Use Groq and Gemini directly from frontend

import { optimizeResume as optimizeResumeWithGroq } from './groq'
import { optimizeResumeWithGemini } from './gemini'

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

// ─── MAIN ANALYZE FUNCTION ───────────────────────────
export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  userInstructions: string = '',
  resumeLength: string = 'auto'
): Promise<AnalysisResult> {
  try {
    console.log('[Frontend] Optimizing with Groq...')
    const result = await optimizeResumeWithGroq(resumeText, jobDescription)
    return result as any as AnalysisResult
  } catch (error) {
    console.error('[Frontend] Groq failed, trying Gemini:', error)
    try {
      const result = await optimizeResumeWithGemini(resumeText, jobDescription)
      return result as any as AnalysisResult
    } catch (geminiError) {
      console.error('[Frontend] Gemini also failed:', geminiError)
      throw new Error('Resume optimization failed. Please try again.')
    }
  }
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
