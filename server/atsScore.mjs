import { GoogleGenerativeAI } from '@google/generative-ai'
import { getGeminiApiKey } from './loadEnv.mjs'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash'

const ATS_PROMPT = (resumeText, jobDescription, optimizedResumeText) => `
You are a professional ATS (Applicant Tracking System) scoring engine used by Fortune 500 recruiters.

Analyze the resume(s) against the job description using this exact 100-point rubric:

RUBRIC:
  1. Keyword Match Score     (35 pts): Count exact + semantic keyword matches from JD in resume
  2. Title & Role Alignment  (25 pts): How well job titles and level match the JD requirements
  3. Experience Relevance    (20 pts): Years of experience, industry match, responsibility match
  4. Format & Parsability    (10 pts): Clean structure, no tables/columns, standard section headers
  5. Skills Coverage         (10 pts): Hard skills and tools listed in JD present in resume

ORIGINAL RESUME:
${resumeText}

${optimizedResumeText ? `OPTIMIZED RESUME:\n${optimizedResumeText}\n` : ''}

JOB DESCRIPTION:
${jobDescription}

Score the ORIGINAL resume for overall_before and the OPTIMIZED resume for overall_after (if optimized provided; otherwise estimate after as +5-15 if improvements are obvious).
For dimensions, score based on the OPTIMIZED resume when provided, else original.

Respond ONLY with this exact JSON (no markdown, no explanation):
{
  "overall_before": 0,
  "overall_after": 0,
  "dimensions": {
    "keyword_match":       { "score": 0, "max": 35 },
    "title_alignment":     { "score": 0, "max": 25 },
    "experience_relevance":{ "score": 0, "max": 20 },
    "format_parsability":  { "score": 0, "max": 10 },
    "skills_coverage":     { "score": 0, "max": 10 }
  },
  "keywords_matched": [],
  "keywords_missing": [],
  "weak_verbs": [{ "original": "", "replacement": "" }],
  "bullets_rewritten": 0,
  "skills_match_pct": 0,
  "verdict": "",
  "tips": ["", "", ""],
  "is_already_optimal": false
}
`

function parseJsonResponse(text) {
  let cleaned = text.trim()
  if (cleaned.includes('```')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
  }
  const match = cleaned.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('No JSON in Gemini response')
  return JSON.parse(match[0])
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function normalizeAtsData(raw) {
  const dims = raw.dimensions || {}
  const normDim = (key, max) => ({
    score: clamp(dims[key]?.score ?? 0, 0, max),
    max,
  })

  return {
    overall_before: clamp(raw.overall_before ?? 0, 0, 100),
    overall_after: clamp(raw.overall_after ?? 0, 0, 100),
    dimensions: {
      keyword_match: normDim('keyword_match', 35),
      title_alignment: normDim('title_alignment', 25),
      experience_relevance: normDim('experience_relevance', 20),
      format_parsability: normDim('format_parsability', 10),
      skills_coverage: normDim('skills_coverage', 10),
    },
    keywords_matched: Array.isArray(raw.keywords_matched) ? raw.keywords_matched.slice(0, 20) : [],
    keywords_missing: Array.isArray(raw.keywords_missing) ? raw.keywords_missing.slice(0, 15) : [],
    weak_verbs: Array.isArray(raw.weak_verbs)
      ? raw.weak_verbs
          .map((v) => ({
            original: v.original || v.from || '',
            replacement: v.replacement || v.to || '',
          }))
          .filter((v) => v.original && v.replacement)
          .slice(0, 12)
      : [],
    bullets_rewritten: clamp(raw.bullets_rewritten ?? 0, 0, 50),
    skills_match_pct: clamp(raw.skills_match_pct ?? 0, 0, 100),
    verdict: String(raw.verdict || 'Analysis complete.').slice(0, 500),
    tips: Array.isArray(raw.tips) ? raw.tips.filter(Boolean).slice(0, 5) : [],
    is_already_optimal: Boolean(raw.is_already_optimal),
    source: 'gemini',
  }
}

export async function calculateAtsScoreWithGemini(
  resumeText,
  jobDescription,
  optimizedResumeText
) {
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured on server')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: MODEL })

  const result = await model.generateContent(
    ATS_PROMPT(resumeText, jobDescription, optimizedResumeText)
  )
  const text = result.response.text()
  if (!text) throw new Error('Empty Gemini response')

  return normalizeAtsData(parseJsonResponse(text))
}
