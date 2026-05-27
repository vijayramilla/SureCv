/**
 * Backend API wrapper for resume optimization
 * Calls the backend /api/optimize-resume endpoint which uses NVIDIA API
 */

import type { EnrichedOptimizeResult } from './scoreData';
import { enrichOptimizationResult } from './scoreData';
import { enforceResumeStructure } from './enforceResumeStructure';

const BACKEND_URL = '';

export interface OptimizeResponse {
  success: boolean;
  data?: {
    atsScore: number;
    scoreDimensions: {
      keywordMatch: number;
      formatScore: number;
      actionVerbScore: number;
      quantifiedBullets: number;
      sectionCompleteness: number;
    };
    scoreLabel: 'Poor' | 'Fair' | 'Good' | 'Excellent';
    missingKeywords: string[];
    addedKeywords: string[];
    weakVerbsFound: Array<{ original: string; replacement: string }>;
    bulletsImproved: number;
    metricsAdded: number;
    industryDetected: 'tech' | 'finance' | 'healthcare' | 'marketing' | 'general';
    recruiterTips: string[];
    rewrittenResume: string;
    coverLetterPoints: string[];
    candidate_name?: string;
    target_role?: string;
    target_company?: string;
    original_score?: number;
    optimized_score?: number;
    score_lift?: number;
    scoreData?: Record<string, unknown>;
  };
  error?: string;
}

/**
 * Call backend /api/optimize-resume endpoint
 * This endpoint calls NVIDIA API with LLaMA 3.3-70B model
 */
export async function optimizeResumeBackend(
  resume: string,
  jobDescription: string
): Promise<EnrichedOptimizeResult> {
  const resumeWordCount = resume.trim().split(/\s+/).filter(Boolean).length;
  const jdWordCount = jobDescription.trim().split(/\s+/).filter(Boolean).length;

  if (resumeWordCount < 30) {
    throw new Error(
      `Resume too short (${resumeWordCount} words). Add your experience, education and skills. Minimum 30 words needed.`
    );
  }

  if (jdWordCount < 20) {
    throw new Error(
      `Job description too short (${jdWordCount} words). Paste the complete job posting. Minimum 20 words needed.`
    );
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/optimize-resume`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume: resume.trim(),
        jobDescription: jobDescription.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        (errorData as { error?: string })?.error ||
        `Server error: ${response.status}`;
      throw new Error(errorMessage);
    }

    const data = (await response.json()) as OptimizeResponse;

    if (!data.success || !data.data) {
      throw new Error(data.error || 'No response data from backend');
    }

    // Process the response
    const result = data.data;
    const atsScore = Math.round(Math.max(0, Math.min(100, result.atsScore || 50)));
    const originalScore = result.original_score || Math.max(20, atsScore - 25);
    const optimizedScore = result.optimized_score || atsScore;

    // Ensure resume structure
    const structuredResume = enforceResumeStructure(
      result.rewrittenResume || '',
      result.candidate_name || 'Candidate Name'
    );

    // Build enriched result
    const enrichedResult: EnrichedOptimizeResult = {
      atsScore,
      scoreDimensions: {
        keywordMatch: Math.max(0, Math.min(100, result.scoreDimensions?.keywordMatch || 0)),
        formatScore: Math.max(0, Math.min(100, result.scoreDimensions?.formatScore || 0)),
        actionVerbScore: Math.max(0, Math.min(100, result.scoreDimensions?.actionVerbScore || 0)),
        quantifiedBullets: Math.max(0, Math.min(100, result.scoreDimensions?.quantifiedBullets || 0)),
        sectionCompleteness: Math.max(0, Math.min(100, result.scoreDimensions?.sectionCompleteness || 0)),
      },
      scoreLabel: (result.scoreLabel || 'Fair') as 'Poor' | 'Fair' | 'Good' | 'Excellent',
      missingKeywords: Array.isArray(result.missingKeywords) ? result.missingKeywords.slice(0, 10) : [],
      addedKeywords: Array.isArray(result.addedKeywords) ? result.addedKeywords.slice(0, 10) : [],
      weakVerbsFound: Array.isArray(result.weakVerbsFound) ? result.weakVerbsFound : [],
      bulletsImproved: result.bulletsImproved || 0,
      metricsAdded: result.metricsAdded || 0,
      industryDetected: (result.industryDetected || 'general') as 'tech' | 'finance' | 'healthcare' | 'marketing' | 'general',
      recruiterTips: Array.isArray(result.recruiterTips) ? result.recruiterTips : [],
      rewrittenResume: structuredResume,
      coverLetterPoints: Array.isArray(result.coverLetterPoints) ? result.coverLetterPoints : [],
      original_score: originalScore,
      optimized_score: optimizedScore,
      score_lift: optimizedScore - originalScore,
      candidate_name: result.candidate_name || 'You',
      target_role: result.target_role || 'Position',
      target_company: result.target_company || 'Company',
      keywords_added: result.addedKeywords || [],
      keywords_missing: result.missingKeywords || [],
      ats_compatibility: {
        taleo: Math.round(atsScore * 0.95),
        workday: Math.round(atsScore * 0.92),
        greenhouse: Math.round(atsScore * 0.88),
        lever: Math.round(atsScore * 0.90),
      },
    };

    return enrichOptimizationResult(enrichedResult, JSON.stringify(result), result.scoreData);
  } catch (error) {
    console.error('Backend optimization error:', error);
    throw error;
  }
}
