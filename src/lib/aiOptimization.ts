import type { EnrichedOptimizeResult } from './scoreData'

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
  // All optimization now happens server-side through backend
  // Frontend only calls /.netlify/functions/optimize-resume
  // Backend handles NVIDIA → Groq → Gemini fallback internally

  try {
    console.info('[Optimize] Calling backend optimization service...')
    
    const response = await fetch('/.netlify/functions/optimize-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeText: resume.trim(),
        jobDescription: jobDescription.trim(),
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = (errorData as any)?.error || `Server error: ${response.status}`
      throw new Error(errorMessage)
    }

    const backendResult = await response.json()

    console.info('[Optimize] Backend optimization succeeded')

    // Convert backend response to EnrichedOptimizeResult format
    return {
      rewrittenResume: backendResult.rewrittenResume,
      keywords_added: backendResult.addedKeywords || [],
      keywords_missing: backendResult.missingKeywords || [],
      ats_score: backendResult.atsAfter || backendResult.score,
      ats_compatibility: {
        taleo: backendResult.scoreDimensions?.keywordMatch || 0,
        workday: backendResult.scoreDimensions?.formatScore || 0,
        greenhouse: backendResult.scoreDimensions?.actionVerbScore || 0,
        lever: backendResult.scoreDimensions?.quantifiedBullets || 0,
        icims: backendResult.scoreDimensions?.sectionCompleteness || 0,
      },
      power_verbs_used: backendResult.weakVerbsReplaced?.map((v: any) => v.replacement) || [],
      metrics_added: backendResult.metricsAdded || 0,
      candidate_name: '',
      target_role: 'Position',
      target_company: 'Company',
      original_score: backendResult.atsBefore || 0,
      optimized_score: backendResult.atsAfter || backendResult.score || 0,
      score_lift: (backendResult.atsAfter || backendResult.score || 0) - (backendResult.atsBefore || 0),
      score_dimensions: backendResult.scoreDimensions || {},
      recruiter_tips: backendResult.recruiterTips || [],
      industry_detected: backendResult.industryDetected || 'general',
      scoreDisplay: {
        before: backendResult.atsBefore || 0,
        after: backendResult.atsAfter || backendResult.score || 0,
        improvement: (backendResult.atsAfter || backendResult.score || 0) - (backendResult.atsBefore || 0),
      },
    }
  } catch (error) {
    console.error('[Optimize] Backend call failed:', error)
    throw new Error(
      (error as Error)?.message || 'Optimization service temporarily unavailable. Please try again.'
    )
  }
}

export async function generateCoverLetter(
  resume: string,
  jobDescription: string,
  _candidateName?: string
): Promise<string> {
  // All cover letter generation now happens server-side through backend
  // Frontend calls /.netlify/functions/optimize-resume which returns coverLetterPoints
  
  try {
    console.info('[Cover letter] Calling backend optimization service for cover letter generation...')
    
    const response = await fetch('/.netlify/functions/optimize-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resumeText: resume.trim(),
        jobDescription: jobDescription.trim(),
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMessage = (errorData as any)?.error || `Server error: ${response.status}`
      throw new Error(errorMessage)
    }

    const backendResult = await response.json()
    const coverLetterPoints = backendResult.coverLetterPoints || []

    if (!Array.isArray(coverLetterPoints) || coverLetterPoints.length === 0) {
      throw new Error('No cover letter points generated')
    }

    // Convert cover letter points to formatted text
    const coverLetterText = [
      'Dear Hiring Manager,',
      '',
      ...coverLetterPoints,
      '',
      'Sincerely,',
      _candidateName || 'Candidate'
    ].join('\n')

    console.info('[Cover letter] Backend cover letter generation succeeded')
    return coverLetterText
  } catch (error) {
    console.error('[Cover letter] Backend call failed:', error)
    throw new Error(
      (error as Error)?.message || 'Cover letter generation temporarily unavailable. Please try again.'
    )
  }
}

export type OptimizeResult = EnrichedOptimizeResult
export type { ATSOptimizationResult, EnrichedOptimizeResult }
