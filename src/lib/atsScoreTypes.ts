export interface AtsDimensionScore {
  score: number
  max: number
}

export interface AtsScoreData {
  overall_before: number
  overall_after: number
  dimensions: {
    keyword_match: AtsDimensionScore
    title_alignment: AtsDimensionScore
    experience_relevance: AtsDimensionScore
    format_parsability: AtsDimensionScore
    skills_coverage: AtsDimensionScore
  }
  keywords_matched: string[]
  keywords_missing: string[]
  weak_verbs: Array<{ original: string; replacement: string }>
  bullets_rewritten: number
  skills_match_pct: number
  verdict: string
  tips: string[]
  is_already_optimal: boolean
  source?: 'gemini' | 'fallback'
}

export const DIMENSION_LABELS: Record<keyof AtsScoreData['dimensions'], string> = {
  keyword_match: 'Keyword Match',
  title_alignment: 'Title Alignment',
  experience_relevance: 'Experience Relevance',
  format_parsability: 'Format & Parsability',
  skills_coverage: 'Skills Coverage',
}
