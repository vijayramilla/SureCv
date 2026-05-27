// Netlify Function: Unified Resume Optimization Backend
// Securely handles NVIDIA NIM, Groq, and Gemini API calls server-side
// All API keys stored in Netlify environment variables only - NEVER exposed to frontend

const ATS_SYSTEM_PROMPT = `You are SureCv's world-class ATS Resume Optimization Engine.

YOUR EXPERTISE:
- ATS systems: Workday, Greenhouse, Taleo, Lever, iCIMS
- Industry keywords: Tech, Finance, Healthcare, Marketing
- 5-dimension ATS scoring system
- Power verb replacement and quantified achievements

ABSOLUTE RULES:
1. EXACT KEYWORD MATCH — use word-for-word from JD
2. SINGLE COLUMN TEXT OUTPUT — no tables
3. STANDARD SECTION HEADERS ONLY
4. EVERY BULLET = [Power Verb] + [Task] + [Metric]
5. REPLACE ALL WEAK VERBS (Worked→Built, Helped→Led, etc.)
6. METRICS ON EVERY BULLET
7. AFTER score MUST be 20+ points higher than BEFORE
8. ALWAYS rewrite EVERY bullet

POWER VERBS: Led, Directed, Architected, Engineered, Developed, Built, Optimized, Delivered, Managed

5-DIMENSION SCORING:
score = (keywordMatch×0.40) + (formatScore×0.20) + (actionVerbScore×0.15) + (quantifiedBullets×0.15) + (sectionCompleteness×0.10)

RETURN ONLY THIS JSON:
{
  "atsBefore": <0-100>,
  "atsAfter": <0-100, must be 20+ higher>,
  "scoreDimensions": {"keywordMatch": <0-100>, "formatScore": <0-100>, "actionVerbScore": <0-100>, "quantifiedBullets": <0-100>, "sectionCompleteness": <0-100>},
  "scoreLabel": <"Poor"|"Fair"|"Good"|"Excellent">,
  "industryDetected": <"tech"|"finance"|"healthcare"|"marketing"|"general">,
  "missingKeywords": ["keyword1","keyword2"],
  "addedKeywords": ["keyword1","keyword2"],
  "weakVerbsReplaced": [{"original":"worked on","replacement":"Architected"}],
  "bulletsRewritten": <number>,
  "metricsAdded": <number>,
  "recruiterTips": ["tip1","tip2"],
  "rewrittenResume": "<full resume with newlines>",
  "coverLetterPoints": ["point1","point2"]
}`;

// API Configuration
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// ─── CLEAN RESUME TEXT ─────────────────────────
function cleanResumeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

// ─── PARSE JSON RESPONSE ─────────────────────────
function parseJsonResponse(content: string) {
  const clean = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .replace(/^\s*[\r\n]/gm, '')
    .trim();

  const jsonStart = clean.indexOf('{');
  const jsonEnd = clean.lastIndexOf('}');

  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON found in response');
  }

  const jsonStr = clean.substring(jsonStart, jsonEnd + 1);
  return JSON.parse(jsonStr);
}

// ─── NVIDIA OPTIMIZATION ─────────────────────────
async function optimizeWithNvidia(resumeText: string, jobDescription: string) {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY not configured');
  }

  console.log('[Backend] Attempting NVIDIA NIM optimization...');

  const userPrompt = `
Optimize this resume for ATS systems matching this job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

MANDATORY:
1. Rewrite EVERY bullet point with [STRONG VERB] [action] [metric]
2. Add EXACT keywords from JD
3. Professional summary with years, top 3 JD keywords, metric, value prop
4. Categorized skills with JD keywords
5. atsBefore = honest score (30-55), atsAfter = new score (75-95, 20+ points higher)
6. Return ONLY valid JSON with all fields.`;

  const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages: [
        { role: 'system', content: ATS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 4096,
      stream: false,
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[Backend] NVIDIA error:', response.status, err);
    throw new Error(`NVIDIA API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from NVIDIA');
  }

  const result = parseJsonResponse(content);

  if (!result.rewrittenResume) {
    throw new Error('rewrittenResume missing from NVIDIA response');
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(result.atsAfter ?? result.score ?? 0))),
    missingKeywords: Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
    rewrittenResume: cleanResumeText(result.rewrittenResume),
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
    coverLetterPoints: result.coverLetterPoints,
  };
}

// ─── GROQ OPTIMIZATION ─────────────────────────
async function optimizeWithGroq(resumeText: string, jobDescription: string) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY not configured');
  }

  console.log('[Backend] Attempting Groq optimization...');

  const userPrompt = `
Optimize this resume for ATS systems matching this job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

MANDATORY:
1. Rewrite EVERY bullet point with [STRONG VERB] [action] [metric]
2. Add EXACT keywords from JD
3. Professional summary with years, top 3 JD keywords, metric, value prop
4. Categorized skills with JD keywords
5. atsBefore = honest score (30-55), atsAfter = new score (75-95, 20+ points higher)
6. Return ONLY valid JSON with all fields.`;

  const response = await fetch(GROQ_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: ATS_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      top_p: 0.9,
      max_tokens: 8192,
      stream: false,
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[Backend] Groq error:', response.status, err);
    throw new Error(`Groq API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('Empty response from Groq');
  }

  const result = parseJsonResponse(content);

  if (!result.rewrittenResume) {
    throw new Error('rewrittenResume missing from Groq response');
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(result.atsAfter ?? result.score ?? 0))),
    missingKeywords: Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
    rewrittenResume: cleanResumeText(result.rewrittenResume),
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
    coverLetterPoints: result.coverLetterPoints,
  };
}

// ─── GEMINI OPTIMIZATION ─────────────────────────
async function optimizeWithGemini(resumeText: string, jobDescription: string) {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  console.log('[Backend] Attempting Gemini optimization...');

  const userPrompt = `
Optimize this resume for ATS systems matching this job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

MANDATORY:
1. Rewrite EVERY bullet point with [STRONG VERB] [action] [metric]
2. Add EXACT keywords from JD
3. Professional summary with years, top 3 JD keywords, metric, value prop
4. Categorized skills with JD keywords
5. atsBefore = honest score (30-55), atsAfter = new score (75-95, 20+ points higher)
6. Return ONLY valid JSON with all fields.`;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: ATS_SYSTEM_PROMPT },
          { text: userPrompt }
        ]
      }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 8192,
      }
    })
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[Backend] Gemini error:', response.status, err);
    throw new Error(`Gemini API error ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    throw new Error('Empty response from Gemini');
  }

  const result = parseJsonResponse(content);

  if (!result.rewrittenResume) {
    throw new Error('rewrittenResume missing from Gemini response');
  }

  return {
    score: Math.min(100, Math.max(0, Math.round(result.atsAfter ?? result.score ?? 0))),
    missingKeywords: Array.isArray(result.missingKeywords) ? result.missingKeywords : [],
    rewrittenResume: cleanResumeText(result.rewrittenResume),
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
    coverLetterPoints: result.coverLetterPoints,
  };
}

// ─── MAIN HANDLER ─────────────────────────
exports.handler = async (event: any, context: any) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true })
    };
  }

  // Only accept POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { resumeText, jobDescription } = JSON.parse(event.body || '{}');

    if (!resumeText || !jobDescription) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'resumeText and jobDescription are required' })
      };
    }

    console.log('[Backend] Processing optimization request...');

    // Try providers in order: NVIDIA → Groq → Gemini
    let lastError: Error | null = null;

    // Try NVIDIA
    try {
      const result = await optimizeWithNvidia(resumeText, jobDescription);
      console.log('[Backend] NVIDIA optimization succeeded');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    } catch (error) {
      lastError = error as Error;
      console.warn('[Backend] NVIDIA failed:', lastError.message);
    }

    // Try Groq
    try {
      const result = await optimizeWithGroq(resumeText, jobDescription);
      console.log('[Backend] Groq optimization succeeded');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    } catch (error) {
      lastError = error as Error;
      console.warn('[Backend] Groq failed:', lastError.message);
    }

    // Try Gemini
    try {
      const result = await optimizeWithGemini(resumeText, jobDescription);
      console.log('[Backend] Gemini optimization succeeded');
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result)
      };
    } catch (error) {
      lastError = error as Error;
      console.warn('[Backend] Gemini failed:', lastError.message);
    }

    // All providers failed
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: 'All optimization services unavailable. Please try again later.',
        details: lastError?.message
      })
    };
  } catch (error) {
    console.error('[Backend] Unhandled error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: (error as Error)?.message
      })
    };
  }
};
