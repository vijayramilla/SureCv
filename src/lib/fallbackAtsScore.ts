import type { AtsScoreData } from './atsScoreTypes'

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  )
}

function matchKeywords(resume: string, jd: string): { matched: string[]; missing: string[] } {
  const jdWords = [...tokenize(jd)].filter((w) => w.length > 3)
  const resumeLower = resume.toLowerCase()
  const matched: string[] = []
  const missing: string[] = []

  const seen = new Set<string>()
  for (const w of jdWords) {
    if (seen.has(w)) continue
    seen.add(w)
    if (resumeLower.includes(w)) matched.push(w)
    else if (missing.length < 12) missing.push(w)
  }

  return { matched: matched.slice(0, 15), missing: missing.slice(0, 10) }
}

export function computeFallbackAtsScore(
  resumeText: string,
  jobDescription: string,
  optimizedResumeText?: string
): AtsScoreData {
  const beforeMatch = matchKeywords(resumeText, jobDescription)
  const afterText = optimizedResumeText?.trim() || resumeText
  const afterMatch = matchKeywords(afterText, jobDescription)

  const jdTokenCount = tokenize(jobDescription).size || 1
  const beforePct = Math.min(100, Math.round((beforeMatch.matched.length / Math.min(jdTokenCount, 30)) * 100))
  const afterPct = Math.min(100, Math.round((afterMatch.matched.length / Math.min(jdTokenCount, 30)) * 100))

  const overallBefore = Math.min(95, Math.max(25, Math.round(beforePct * 0.85 + 15)))
  const overallAfter = Math.min(98, Math.max(overallBefore, Math.round(afterPct * 0.85 + 18)))

  const keywordScore = Math.round((afterMatch.matched.length / Math.max(afterMatch.matched.length + afterMatch.missing.length, 1)) * 35)

  return {
    overall_before: overallBefore,
    overall_after: overallAfter,
    dimensions: {
      keyword_match: { score: Math.min(35, keywordScore), max: 35 },
      title_alignment: { score: Math.min(25, Math.round(overallAfter * 0.22)), max: 25 },
      experience_relevance: { score: Math.min(20, Math.round(overallAfter * 0.18)), max: 20 },
      format_parsability: { score: 8, max: 10 },
      skills_coverage: { score: Math.min(10, Math.round(afterPct / 10)), max: 10 },
    },
    keywords_matched: afterMatch.matched,
    keywords_missing: afterMatch.missing,
    weak_verbs: [],
    bullets_rewritten: 0,
    skills_match_pct: afterPct,
    verdict:
      overallAfter >= 80
        ? 'Strong keyword alignment with the job description; minor gaps may remain in niche tools.'
        : 'Resume shows partial alignment — add more exact keywords from the job posting.',
    tips: [
      'Mirror exact tool names and skills from the job description in your skills section.',
      'Submit as PDF unless the employer requests DOCX.',
      'Lead each bullet with a strong action verb and a measurable result.',
    ],
    is_already_optimal: overallAfter - overallBefore <= 3 && overallAfter >= 82,
    source: 'fallback',
  }
}
