import {
  analyzeResume as analyzeResumeViaProxy,
  generateCoverLetter as generateCoverLetterViaProxy,
} from '../utils/nvidia'

export interface AnalysisResult {
  score: number
  missingKeywords: string[]
  rewrittenResume: string
  atsBefore?: number
  atsAfter?: number
  scoreDimensions?: Record<string, number>
  scoreLabel?: string
  industryDetected?: string
  addedKeywords?: string[]
  weakVerbsReplaced?: Array<{ original: string; replacement: string }>
  bulletsRewritten?: number
  metricsAdded?: number
  recruiterTips?: string[]
  coverLetterPoints?: string[]
}

export async function analyzeResume(
  resumeText: string,
  jobDescription: string,
  userInstructions: string = '',
  resumeLength: string = 'auto'
): Promise<AnalysisResult> {
  console.log('[Frontend] Optimizing via SureCv API (NVIDIA NIM proxy)...')
  const data = await analyzeResumeViaProxy(
    resumeText,
    jobDescription,
    userInstructions,
    resumeLength
  )

  return {
    score: data.atsAfter ?? 0,
    missingKeywords: data.missingKeywords ?? [],
    rewrittenResume: data.rewrittenResume ?? '',
    atsBefore: data.atsBefore,
    atsAfter: data.atsAfter,
    scoreDimensions: data.scoreDimensions,
    scoreLabel: data.scoreLabel,
    industryDetected: data.industryDetected,
    addedKeywords: data.addedKeywords,
    weakVerbsReplaced: data.weakVerbsReplaced,
    bulletsRewritten: data.bulletsRewritten,
    metricsAdded: data.metricsAdded,
    recruiterTips: data.recruiterTips,
    coverLetterPoints: data.coverLetterPoints,
  }
}

export async function generateCoverLetter(
  resumeText: string,
  jobDescription: string,
  jobTitle?: string,
  companyName?: string
): Promise<string> {
  return generateCoverLetterViaProxy(
    resumeText,
    jobDescription,
    jobTitle ?? '',
    companyName ?? ''
  )
}

export async function improveBullet(
  bullet: string,
  _jobTitle?: string
): Promise<string> {
  return bullet
}

export async function improveSummary(
  summary: string,
  _jobTitle?: string
): Promise<string> {
  return summary
}
