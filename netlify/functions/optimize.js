// Netlify Function: Resume Optimization Backend
// Securely handles NVIDIA NIM API calls (API key never exposed to frontend)

const ATS_SYSTEM_PROMPT = `You are SureCv's world-class ATS Resume Optimization Engine powered by NVIDIA AI.

YOUR EXPERTISE:
- ATS systems: Workday, Greenhouse, Taleo, Lever, iCIMS
- Industry keywords: Tech, Finance, Healthcare, Marketing
- 5-dimension ATS scoring system
- Power verb replacement and quantified achievements

ABSOLUTE RULES — NEVER BREAK:
1. EXACT KEYWORD MATCH — use word-for-word from JD
   "Project Management" NOT "managing projects"
   "Machine Learning" NOT "ML" alone
2. SINGLE COLUMN TEXT OUTPUT — no tables, no columns
3. STANDARD SECTION HEADERS ONLY:
   PROFESSIONAL SUMMARY / WORK EXPERIENCE / 
   SKILLS / EDUCATION / CERTIFICATIONS / PROJECTS
4. EVERY BULLET = [Power Verb] + [Task] + [Metric]
5. REPLACE ALL WEAK VERBS:
   Worked → Built/Engineered/Developed
   Helped → Led/Supported/Facilitated
   Did → Executed/Delivered/Implemented
   Was responsible → Managed/Directed/Oversaw
6. METRICS ON EVERY BULLET:
   Junior role: 10-25% improvements
   Mid level: 25-50% improvements
   Senior level: 40-70% improvements
7. AFTER score MUST be higher than BEFORE by 20+ points
8. ALWAYS rewrite EVERY bullet — never return unchanged

POWER VERBS BY CATEGORY:
LEADERSHIP: Led, Directed, Spearheaded, Championed, Orchestrated
BUILDING: Architected, Engineered, Developed, Built, Launched
IMPROVING: Optimized, Streamlined, Accelerated, Transformed
ACHIEVING: Delivered, Exceeded, Generated, Secured, Surpassed
ANALYZING: Analyzed, Evaluated, Identified, Synthesized
MANAGING: Managed, Coordinated, Oversaw, Administered

5-DIMENSION SCORING:
score = (keywordMatch×0.40) + (formatScore×0.20) + 
        (actionVerbScore×0.15) + (quantifiedBullets×0.15) + 
        (sectionCompleteness×0.10)

CRITICAL FORMATTING RULE FOR rewrittenResume:
You MUST use actual newline characters \\n between every single line.

RULES FOR rewrittenResume:
- ALWAYS use \\n (actual newline characters) between lines
- Single \\n between lines within same section
- Double \\n\\n between major sections
- Use • for ALL bullet points (not -, *, or ◦)
- Use — (em dash) between job title and company
- Use | (pipe) to separate contact items or info
- Section headers MUST be ALL CAPS on their own line
- NEVER use markdown (**bold**, *italic*, ##headers, etc)
- NEVER return all text on a single line
- NO trailing spaces after lines

RETURN ONLY THIS JSON — no markdown, no backticks:
{
  "atsBefore": <0-100 original resume score>,
  "atsAfter": <0-100 improved score, always 20+ higher>,
  "scoreDimensions": {
    "keywordMatch": <0-100>,
    "formatScore": <0-100>,
    "actionVerbScore": <0-100>,
    "quantifiedBullets": <0-100>,
    "sectionCompleteness": <0-100>
  },
  "scoreLabel": <"Poor"|"Fair"|"Good"|"Excellent">,
  "industryDetected": <"tech"|"finance"|"healthcare"|"marketing"|"general">,
  "missingKeywords": ["keyword1","keyword2","keyword3"],
  "addedKeywords": ["keyword1","keyword2","keyword3"],
  "weakVerbsReplaced": [
    {"original":"worked on","replacement":"Architected"}
  ],
  "bulletsRewritten": <number>,
  "metricsAdded": <number>,
  "recruiterTips": [
    "tip1","tip2","tip3"
  ],
  "rewrittenResume": "<full resume text with actual newlines>",
  "coverLetterPoints": ["point1","point2","point3"]
}`

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct'

// ─── CLEAN RESUME TEXT ─────────────────────────
function cleanResumeText(text) {
  if (!text) return ''
  return text
    .replace(/\\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim()
}

// ─── OPTIMIZE RESUME ─────────────────────────
async function optimizeResume(resumeText, jobDescription, userInstructions = '', resumeLength = 'auto') {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY not configured on backend')
  }

  const lengthInstruction = {
    auto: 'Decide page length based on experience level.',
    '1page': 'STRICT 1 PAGE ONLY — cut ruthlessly, most recent 2 roles only.',
    '2page': 'Allow up to 2 pages — include all relevant experience.',
    academic: 'Academic CV format — include all publications, research, teaching.'
  }

  const userPrompt = `
You are analyzing this resume for ATS optimization.

ORIGINAL RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

${userInstructions ? `USER INSTRUCTIONS: ${userInstructions}` : ''}

MANDATORY TASK — DO ALL OF THESE:

1. REWRITE EVERY SINGLE BULLET POINT completely.
   Original bullets are WEAK and GENERIC.
   New bullets MUST follow: 
   [STRONG VERB] [specific action] [tool/method used] 
   resulting in [EXACT % or ₹ or number metric]

2. ADD EXACT KEYWORDS from job description.
   If JD mentions specific tools, software, methods — inject them NATURALLY into bullets and skills.

3. PROFESSIONAL SUMMARY must include:
   - Years of experience
   - Top 3 JD keywords
   - One specific achievement metric
   - Value proposition statement

4. SKILLS must be categorized with exact JD keywords:
   Core Skills: [relevant skills from JD]
   Technical: [technical tools/languages from JD]

5. ATS SCORE CALCULATION — CRITICAL:
   atsBefore = HONEST score of ORIGINAL resume (usually 30-55)
   atsAfter = score of REWRITTEN resume (MUST be 75-95, demonstrate massive improvement)
   SCORE DIFFERENCE MUST BE AT LEAST 25 POINTS.

6. Return ONLY valid JSON with all required fields.`

  console.log('[Backend] Calling NVIDIA NIM API...')
  console.log('[Backend] Model:', NVIDIA_MODEL)
  console.log('[Backend] URL:', NVIDIA_BASE_URL)

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        {
          role: 'system',
          content: ATS_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 4096,
      stream: false,
    })
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('[Backend] NVIDIA API Error:', err)
    throw new Error(`NVIDIA API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error('Empty response from NVIDIA API')
  }

  // Clean and parse JSON
  const clean = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/^\s*[\r\n]/gm, '')
    .trim()

  const jsonStart = clean.indexOf('{')
  const jsonEnd = clean.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON found in NVIDIA response')
  }

  const jsonStr = clean.substring(jsonStart, jsonEnd + 1)

  try {
    const result = JSON.parse(jsonStr)

    if (!result.rewrittenResume) {
      throw new Error('rewrittenResume missing from response')
    }

    const cleanedResume = cleanResumeText(
      typeof result.rewrittenResume === 'string' ? result.rewrittenResume : ''
    )

    return {
      score: Math.min(100, Math.max(0, Math.round(result.atsAfter ?? result.score ?? 0))),
      missingKeywords: Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
      rewrittenResume: cleanedResume,
      atsBefore: result.atsBefore,
      atsAfter: result.atsAfter,
      scoreDimensions: result.scoreDimensions,
      scoreLabel: result.scoreLabel,
      industryDetected: result.industryDetected,
      addedKeywords: result.addedKeywords,
      weakVerbsReplaced: result.weakVerbsReplaced,
      bulletsRewritten: result.bulletsRewritten,
      metricsAdded: result.metricsAdded,
      recruiterTips: result.recruiterTips,
      coverLetterPoints: result.coverLetterPoints
    }
  } catch (parseError) {
    console.error('[Backend] JSON Parse Error:', parseError)
    throw new Error('Failed to parse NVIDIA response as JSON')
  }
}

// ─── MAIN HANDLER ─────────────────────────
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  }

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true })
    }
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { resumeText, jobDescription, userInstructions = '', resumeLength = 'auto' } = JSON.parse(event.body || '{}')

    // Validate input
    if (!resumeText || !jobDescription) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'resumeText and jobDescription are required' })
      }
    }

    console.log('[Backend] Processing optimization request...')
    const result = await optimizeResume(resumeText, jobDescription, userInstructions, resumeLength)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    }
  } catch (error) {
    console.error('[Backend] Error:', error.message)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: error.message || 'Optimization failed',
        details: error.toString()
      })
    }
  }
}
