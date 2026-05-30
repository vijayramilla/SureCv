import type { EnrichedOptimizeResult } from './scoreData'
import {
  optimizeResume as optimizeResumeViaBackend,
  generateCoverLetter as generateCoverLetterViaBackend,
} from './nvidia'

/**
 * All AI calls go through the Railway backend proxy.
 * No API keys in the browser bundle.
 */
export async function optimizeResume(
  resume: string,
  jobDescription: string
): Promise<EnrichedOptimizeResult> {
  const result = await optimizeResumeViaBackend(resume, jobDescription)
  return result as EnrichedOptimizeResult
}

export async function generateCoverLetter(
  resume: string,
  jobDescription: string,
  _candidateName?: string
): Promise<string> {
  return generateCoverLetterViaBackend(
    resume,
    jobDescription,
    '',
    '',
    'professional'
  )
}

export type OptimizeResult = EnrichedOptimizeResult
export type { EnrichedOptimizeResult }
