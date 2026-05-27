import type { ATSOptimizationResult } from './groq'

export interface ScoreDisplayData {
  before: number
  after: number
  keywordsAdded: number
  bulletsRewritten: number
  skillsMatchPct: number
  keywordsAddedList: string[]
  keywordsMissingList: string[]
  verbsReplaced: Array<{ from: string; to: string }>
  analysisMessage: string
  rubricMessage: string
  tips: string[]
  changesMade: boolean
}

export interface RawScoreDataPayload {
  before?: number
  after?: number
  keywords_added?: number
  bullets_rewritten?: number
  skills_match_pct?: number
  keywords_added_list?: string[]
  keywords_missing_list?: string[]
  verbs_replaced?: Array<{ from?: string; to?: string; original?: string; replacement?: string }>
  analysis_message?: string
  rubric_message?: string
  tips?: string[]
}

/** Split main JSON from optional SCORE_DATA suffix. */
export function extractJsonFromAiResponse(response: string): string {
  const idx = response.indexOf('SCORE_DATA:')
  if (idx === -1) return response.trim()
  return response.slice(0, idx).trim()
}

export function parseScoreDataSuffix(response: string): RawScoreDataPayload | null {
  const idx = response.indexOf('SCORE_DATA:')
  if (idx === -1) return null
  const raw = response.slice(idx + 'SCORE_DATA:'.length).trim()
  try {
    return JSON.parse(raw) as RawScoreDataPayload
  } catch {
    return null
  }
}

function mapVerbs(
  verbs: RawScoreDataPayload['verbs_replaced']
): Array<{ from: string; to: string }> {
  if (!Array.isArray(verbs)) return []
  return verbs
    .map((v) => ({
      from: v.from || v.original || '',
      to: v.to || v.replacement || '',
    }))
    .filter((v) => v.from && v.to)
}

export function buildScoreDisplay(
  result: ATSOptimizationResult,
  rawPayload?: RawScoreDataPayload | null,
  embedded?: RawScoreDataPayload | null
): ScoreDisplayData {
  const payload = { ...embedded, ...rawPayload }

  const before = Math.round(
    payload.before ?? result.original_score ?? Math.max(20, (result.optimized_score || 50) - 20)
  )
  const after = Math.round(
    payload.after ?? result.optimized_score ?? result.atsScore ?? 50
  )

  const keywordsAddedList =
    payload.keywords_added_list?.length
      ? payload.keywords_added_list
      : result.addedKeywords || result.keywords_added || []

  const keywordsMissingList =
    payload.keywords_missing_list?.length
      ? payload.keywords_missing_list
      : result.missingKeywords || result.keywords_missing || []

  const verbsFromPayload = mapVerbs(payload.verbs_replaced)
  const verbsFromResult = (result.weakVerbsFound || []).map((v) => ({
    from: v.original,
    to: v.replacement,
  }))
  const verbsReplaced = verbsFromPayload.length ? verbsFromPayload : verbsFromResult

  const bulletsRewritten =
    payload.bullets_rewritten ?? result.bulletsImproved ?? 0
  const keywordsAdded =
    payload.keywords_added ?? keywordsAddedList.length

  const lift = after - before
  const changesMade =
    lift > 3 ||
    bulletsRewritten > 0 ||
    keywordsAdded > 0 ||
    verbsReplaced.length > 0

  const defaultAnalysis = changesMade
    ? 'Your resume was updated to better match the job description with stronger keywords and bullet phrasing.'
    : 'Your resume already contains the critical keywords and structure this role requires. No fabricated changes were added.'

  const defaultRubric = after >= 80
    ? 'already covers all JD requirements'
    : after >= 60
      ? 'shows solid alignment with most requirements'
      : 'could improve with more role-specific keywords'

  return {
    before,
    after,
    keywordsAdded,
    bulletsRewritten,
    skillsMatchPct: Math.round(
      payload.skills_match_pct ??
        result.scoreDimensions?.keywordMatch ??
        Math.min(100, after)
    ),
    keywordsAddedList,
    keywordsMissingList,
    verbsReplaced,
    analysisMessage: payload.analysis_message?.trim() || defaultAnalysis,
    rubricMessage: payload.rubric_message?.trim() || defaultRubric,
    tips:
      payload.tips?.length
        ? payload.tips
        : result.recruiterTips?.length
          ? result.recruiterTips
          : [
              'Submit as PDF unless the application requests DOCX',
              'Keep formatting clean — no tables, columns, or text boxes',
              'Tailor the summary section for each role you apply to',
            ],
    changesMade,
  }
}

export type EnrichedOptimizeResult = ATSOptimizationResult & {
  scoreDisplay: ScoreDisplayData
}

export function enrichOptimizationResult(
  result: ATSOptimizationResult,
  rawResponse: string,
  parsedPayload?: { scoreData?: RawScoreDataPayload }
): EnrichedOptimizeResult {
  const suffix = parseScoreDataSuffix(rawResponse)
  const embedded = parsedPayload?.scoreData ?? (parsedPayload as RawScoreDataPayload)
  const scoreDisplay = buildScoreDisplay(result, suffix, embedded)

  return {
    ...result,
    original_score: scoreDisplay.before,
    optimized_score: scoreDisplay.after,
    score_lift: scoreDisplay.after - scoreDisplay.before,
    addedKeywords: scoreDisplay.keywordsAddedList,
    missingKeywords: scoreDisplay.keywordsMissingList,
    keywords_added: scoreDisplay.keywordsAddedList,
    keywords_missing: scoreDisplay.keywordsMissingList,
    weakVerbsFound: scoreDisplay.verbsReplaced.map((v) => ({
      original: v.from,
      replacement: v.to,
    })),
    bulletsImproved: scoreDisplay.bulletsRewritten,
    recruiterTips: scoreDisplay.tips,
    scoreDisplay,
  }
}
