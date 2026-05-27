import {
  analyzeResume as analyzeResumeNvidiaViaLegacy,
  type AnalysisResult,
} from './nvidia-nim'
import {
  optimizeResume as optimizeResumeGroq,
  generateCoverLetter as generateCoverLetterGroq,
  type ATSOptimizationResult,
  type EnrichedOptimizeResult,
} from './groq'
import {
  optimizeResumeWithGemini,
  generateCoverLetterWithGemini,
} from './gemini'
import {
  isRetryableApiError,
  isUserInputValidationError,
  mergeProviderErrors,
  parseApiError,
} from './apiErrors'

/**
 * Convert nvidia-nim AnalysisResult to EnrichedOptimizeResult format
 */
function convertAnalysisResultToEnriched(analysisResult: AnalysisResult): EnrichedOptimizeResult {
  return {
    rewrittenResume: analysisResult.rewrittenResume,
    keywords_added: analysisResult.addedKeywords || [],
    keywords_missing: analysisResult.missingKeywords || [],
    ats_score: analysisResult.atsAfter || analysisResult.score,
    ats_compatibility: {
      taleo: analysisResult.scoreDimensions?.keywordMatch || 0,
      workday: analysisResult.scoreDimensions?.formatScore || 0,
      greenhouse: analysisResult.scoreDimensions?.actionVerbScore || 0,
      lever: analysisResult.scoreDimensions?.quantifiedBullets || 0,
      icims: analysisResult.scoreDimensions?.sectionCompleteness || 0,
    },
    power_verbs_used: analysisResult.weakVerbsReplaced?.map(v => v.replacement) || [],
    metrics_added: analysisResult.metricsAdded || 0,
    candidate_name: '',
    target_role: 'Position',
    target_company: 'Company',
    original_score: analysisResult.atsBefore || 0,
    optimized_score: analysisResult.atsAfter || analysisResult.score || 0,
    score_lift: (analysisResult.atsAfter || analysisResult.score || 0) - (analysisResult.atsBefore || 0),
    score_dimensions: analysisResult.scoreDimensions || {},
    recruiter_tips: analysisResult.recruiterTips || [],
    industry_detected: analysisResult.industryDetected || 'general',
    scoreDisplay: {
      before: analysisResult.atsBefore || 0,
      after: analysisResult.atsAfter || analysisResult.score || 0,
      lift: (analysisResult.atsAfter || analysisResult.score || 0) - (analysisResult.atsBefore || 0),
      label: analysisResult.scoreLabel || 'Good',
      dimension_scores: {
        keyword_match: analysisResult.scoreDimensions?.keywordMatch || 0,
        format: analysisResult.scoreDimensions?.formatScore || 0,
        action_verbs: analysisResult.scoreDimensions?.actionVerbScore || 0,
        metrics: analysisResult.scoreDimensions?.quantifiedBullets || 0,
        completeness: analysisResult.scoreDimensions?.sectionCompleteness || 0,
      },
      change_insights: [],
    },
  }
}

/**
 * Optimize resume: NVIDIA NIM (Primary) → Groq → Gemini
 */
export async function optimizeResume(
  resume: string,
  jobDescription: string
): Promise<EnrichedOptimizeResult> {
  const errors: unknown[] = []

  // Try NVIDIA NIM first (primary)
  try {
    console.info('[Optimize] Attempting NVIDIA NIM (LLaMA 3.3-70B)...')
    const analysisResult = await analyzeResumeNvidiaViaLegacy(resume, jobDescription)
    const enrichedResult = convertAnalysisResultToEnriched(analysisResult)
    console.info('[Optimize] NVIDIA NIM succeeded')
    return enrichedResult
  } catch (nvidiaError) {
    errors.push(nvidiaError)
    console.warn(
      '[Optimize] NVIDIA NIM failed, trying Groq:',
      parseApiError(nvidiaError).code
    )
  }

  // Fallback to Groq
  try {
    console.info('[Optimize] Attempting Groq fallback...')
    return await optimizeResumeGroq(resume, jobDescription)
  } catch (groqError) {
    errors.push(groqError)

    if (isUserInputValidationError(groqError) || !isRetryableApiError(groqError)) {
      throw groqError
    }

    console.warn(
      '[Optimize] Groq failed, trying Gemini:',
      parseApiError(groqError).code
    )

    try {
      const result = await optimizeResumeWithGemini(resume, jobDescription)
      console.info('[Optimize] Gemini fallback succeeded')
      return result
    } catch (geminiError) {
      errors.push(geminiError)
      throw new Error(mergeProviderErrors(errors).userMessage)
    }
  }
}

export async function generateCoverLetter(
  resume: string,
  jobDescription: string,
  _candidateName?: string
): Promise<string> {
  const errors: unknown[] = []

  // Try backend NVIDIA first
  try {
    console.info('[Cover letter] Attempting Backend NVIDIA...')
    return await generateCoverLetterNvidia(resume, jobDescription)
  } catch (backendError) {
    errors.push(backendError)
    console.warn(
      '[Cover letter] Backend failed, trying Groq:',
      parseApiError(backendError).code
    )
  }

  // Try Groq
  try {
    return await generateCoverLetterGroq(resume, jobDescription)
  } catch (groqError) {
    errors.push(groqError)

    if (!isRetryableApiError(groqError)) {
      throw groqError
    }

    console.warn(
      '[Cover letter] Groq failed, trying Gemini:',
      parseApiError(groqError).code
    )

    try {
      return await generateCoverLetterWithGemini(resume, jobDescription, _candidateName)
    } catch (geminiError) {
      errors.push(geminiError)
      const merged = mergeProviderErrors(errors)
      throw new Error(
        merged.userMessage.replace('Resume optimization', 'Cover letter generation')
      )
    }
  }
}

export type OptimizeResult = EnrichedOptimizeResult
export type { ATSOptimizationResult, EnrichedOptimizeResult }
