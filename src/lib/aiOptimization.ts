import type { EnrichedOptimizeResult } from './scoreData'
import { optimizeResume as optimizeResumeWithNvidia, generateCoverLetter as generateCoverLetterWithNvidia } from './nvidia'
import { optimizeResume as optimizeResumeWithGroq } from './groq'
import { optimizeResumeWithGemini } from './gemini'


/**
 * Optimize resume: NVIDIA (Primary) → Groq (Fallback) → Gemini (Final Fallback)
 */
export async function optimizeResume(
  resume: string,
  jobDescription: string
): Promise<EnrichedOptimizeResult> {
  try {
    console.info('[Optimize] Calling NVIDIA optimization service...')
    
    const result = await optimizeResumeWithNvidia(resume, jobDescription)

    console.info('[Optimize] NVIDIA optimization succeeded')

    // Result is already in EnrichedOptimizeResult format from nvidia.ts
    return result as EnrichedOptimizeResult
  } catch (error) {
    console.error('[Optimize] NVIDIA failed, trying Groq:', error)
    
    // Fallback to Groq
    try {
      console.info('[Optimize] Calling Groq as fallback...')
      const result = await optimizeResumeWithGroq(resume, jobDescription)
      console.info('[Optimize] Groq fallback succeeded')
      return result as EnrichedOptimizeResult
    } catch (groqError) {
      console.error('[Optimize] Groq fallback failed, trying Gemini:', groqError)
      
      // Final fallback to Gemini
      try {
        console.info('[Optimize] Calling Gemini as final fallback...')
        const result = await optimizeResumeWithGemini(resume, jobDescription)
        console.info('[Optimize] Gemini fallback succeeded')
        return result
      } catch (geminiError) {
        console.error('[Optimize] All AI engines failed:', geminiError)
        throw new Error(
          (geminiError as Error)?.message || 'Optimization service temporarily unavailable. Please try again.'
        )
      }
    }
  }
}

import { generateCoverLetterWithGemini } from './gemini'


export async function generateCoverLetter(
  resume: string,
  jobDescription: string,
  candidateName?: string
): Promise<string> {
  try {
    console.info('[Cover letter] Calling NVIDIA for cover letter generation...')
    
    const coverLetterText = await generateCoverLetterWithNvidia(
      resume,
      jobDescription,
      'Professional'
    )

    console.info('[Cover letter] NVIDIA cover letter generation succeeded')
    return coverLetterText
  } catch (error) {
    console.error('[Cover letter] NVIDIA failed, trying Gemini:', error)
    
    // Fallback to Gemini
    try {
      console.info('[Cover letter] Calling Gemini as fallback...')
      const coverLetterText = await generateCoverLetterWithGemini(
        resume,
        jobDescription,
        candidateName
      )
      console.info('[Cover letter] Gemini fallback succeeded')
      return coverLetterText
    } catch (geminiError) {
      console.error('[Cover letter] Gemini fallback also failed:', geminiError)
      throw new Error(
        (geminiError as Error)?.message || 'Cover letter generation temporarily unavailable. Please try again.'
      )
    }
  }
}

export type OptimizeResult = EnrichedOptimizeResult
export type { EnrichedOptimizeResult }
