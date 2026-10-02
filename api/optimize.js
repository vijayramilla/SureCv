/**
 * SureCv — POST /api/optimize (Vercel serverless function)
 * Ported from server/index.js (Express) for Vercel deployment.
 */
import {
  json,
  handleOptions,
  applyCors,
  readJsonBody,
  callNvidia,
  parseJsonFromContent,
  cleanRewrittenResume,
} from './_lib/ai.js'

const lengthRuleFor = (resumeLength) =>
  ({
    auto: 'Decide page count based on experience.',
    '1page': 'STRICT 1 PAGE — cut to most recent 2 roles only.',
    '2page': 'Up to 2 pages — keep all relevant experience.',
    academic: 'Full academic CV format.',
  })[resumeLength] || ''

const systemPrompt = `You are SureCv's world-class ATS 
Resume Optimization Engine. You MUST completely rewrite 
every resume bullet using this formula:
[POWER VERB] + [specific action] + [tool/method] + [metric %/₹/#]

POWER VERBS: Led, Built, Architected, Optimized, Generated,
Delivered, Spearheaded, Engineered, Transformed, Accelerated

RULES:
1. REWRITE EVERY SINGLE BULLET — no exceptions
2. Add EXACT keywords from job description
3. Every bullet needs a metric (%, ₹, number, time)
4. atsBefore = honest score of original (30-55 range)
5. atsAfter = score of rewritten (must be 75-95 range)
6. Difference must be 25+ points minimum
7. rewrittenResume uses REAL newline characters \\n

8. NO markdown symbols (**, ##, *)
9. Section headers: PROFESSIONAL SUMMARY, WORK EXPERIENCE,
   SKILLS, EDUCATION, CERTIFICATIONS

EXACT rewrittenResume FORMAT:
[Full Name]\\n
[email] | [phone] | [city]\\n
\\n
PROFESSIONAL SUMMARY\\n
[2-3 sentences with JD keywords + achievement metric]\\n
\\n
WORK EXPERIENCE\\n
\\n
[Job Title] — [Company] | [Date]\\n
[City]\\n
- [PowerVerb specific achievement metric]\\n
- [PowerVerb specific achievement metric]\\n
- [PowerVerb specific achievement metric]\\n
\\n
SKILLS\\n
[Category]: [skill1], [skill2], [skill3]\\n
\\n
EDUCATION\\n
[Degree] — [Institution] | [Year]\\n

Return ONLY valid JSON:
{
  "atsBefore": <30-55>,
  "atsAfter": <75-95>,
  "scoreDimensions": {
    "keywordMatch": <0-100>,
    "formatScore": <0-100>,
    "actionVerbScore": <0-100>,
    "quantifiedBullets": <0-100>,
    "sectionCompleteness": <0-100>
  },
  "scoreLabel": "Good" or "Excellent",
  "industryDetected": "tech|finance|healthcare|marketing|sales|general",
  "missingKeywords": ["keyword1","keyword2","keyword3","keyword4","keyword5"],
  "addedKeywords": ["keyword1","keyword2","keyword3","keyword4","keyword5"],
  "weakVerbsReplaced": [
    {"original":"worked on","replacement":"Engineered"}
  ],
  "bulletsRewritten": <number>,
  "metricsAdded": <number>,
  "recruiterTips": ["tip1","tip2","tip3"],
  "rewrittenResume": "<full resume with real newlines>",
  "coverLetterPoints": ["point1","point2","point3"]
}`

export default async function handler(req, res) {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    if (!handleOptions(req, res)) json(res, 403, { error: 'CORS blocked' })
    return
  }
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  try {
    const {
      resumeText,
      jobDescription,
      userInstructions = '',
      resumeLength = 'auto',
    } = readJsonBody(req)

    if (!resumeText || !jobDescription) {
      return json(res, 400, {
        error: 'Resume and job description required',
      })
    }

    const lengthRule = lengthRuleFor(resumeLength)

    const userPrompt = `RESUME:\\n${resumeText}\\n\\n

JOB DESCRIPTION:\\n${jobDescription}\\n\\n

${userInstructions ? `USER INSTRUCTIONS:\\n${userInstructions}\\n\\n` : ''}
${lengthRule}

Completely rewrite this resume. 
Return ONLY valid JSON. No markdown. No backticks.`

    console.log('[SureCv API] Calling NVIDIA NIM...')

    const content = await callNvidia(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 4096 }
    )

    if (!content) {
      return json(res, 502, { error: 'Empty AI response' })
    }

    const result = parseJsonFromContent(content)

    if (result.rewrittenResume) {
      result.rewrittenResume = cleanRewrittenResume(result.rewrittenResume)
    }

    console.log('[SureCv API] Success! ATS:', result.atsBefore, '→', result.atsAfter)

    return json(res, 200, result)
  } catch (error) {
    console.error('[SureCv API Error]', error)
    return json(res, error?.status || 500, {
      error: 'Optimization failed. Please try again.',
    })
  }
}
