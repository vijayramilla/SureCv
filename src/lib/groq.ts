import { isRetryableApiError, parseApiError, parseRetryAfterHeader } from './apiErrors';
import { callGeminiText } from './gemini';
import {
  enrichOptimizationResult,
  extractJsonFromAiResponse,
  type EnrichedOptimizeResult,
} from './scoreData';
import { enforceResumeStructure } from './enforceResumeStructure';

const GROQ_API_KEYS = [
  (import.meta.env.VITE_GROQ_API_KEY as string | undefined)?.trim(),
  (import.meta.env.VITE_GROQ_API_KEY_SECONDARY as string | undefined)?.trim(),
].filter((key): key is string => Boolean(key && key.length > 0));

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

function isGroqLimitResponse(status: number, message: string): boolean {
  const lower = message.toLowerCase();
  return (
    status === 429 ||
    status === 402 ||
    status === 503 ||
    lower.includes('rate limit') ||
    lower.includes('quota') ||
    lower.includes('limit') ||
    lower.includes('tokens')
  );
}

export interface ATSScoreDimensions {
  keywordMatch: number;
  formatScore: number;
  actionVerbScore: number;
  quantifiedBullets: number;
  sectionCompleteness: number;
}

export interface ATSOptimizationResult {
  atsScore: number;
  scoreDimensions: ATSScoreDimensions;
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

  // Backward compatibility fields - required for OptimizePage
  original_score: number;
  optimized_score: number;
  score_lift: number;
  candidate_name: string;
  target_role: string;
  target_company: string;
  ats_compatibility: {
    taleo: number;
    workday: number;
    greenhouse: number;
    lever: number;
  };
  keywords_added: string[];
  keywords_missing: string[];
  
  // Alias for backward compatibility
  optimized_resume?: string;
}

// Legacy export for backward compatibility
export type OptimizeResult = ATSOptimizationResult;

export interface BulletSuggestions {
  suggestions: string[];
}

export interface JobSummary {
  job_title: string;
  company: string;
  key_skills: string[];
  experience_required: string;
  key_responsibilities: string[];
  nice_to_have: string[];
}

async function callGroqWithKey(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  options?: { timeoutMs?: number }
): Promise<string> {
  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 30000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.2,
        max_tokens: 8192,  // Increased from 4096 to prevent truncation
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
      }),
    });

    clearTimeout(timeout);

    if (response.status === 401) {
      throw new Error(
        'Service authentication failed. Please contact support.'
      );
    }
    const errorData = !response.ok
      ? await response.json().catch(() => ({}))
      : null;
    const errMsg =
      (errorData as { error?: { message?: string } })?.error?.message || '';

    if (!response.ok) {
      if (isGroqLimitResponse(response.status, errMsg)) {
        const retryAfter =
          parseRetryAfterHeader(response.headers.get('Retry-After')) ??
          parseRetryAfterHeader(response.headers.get('retry-after')) ??
          60;
        throw new Error(
          `Rate limit reached. Wait ${retryAfter} seconds and try again.`
        );
      }
      if (response.status === 503) {
        throw new Error(
          'Our engine is temporarily busy. Please wait 45 seconds and try again.'
        );
      }
      throw new Error(errMsg || `API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Empty response from engine. Please try again.');
    }

    return data.choices[0].message.content;
  } catch (error: unknown) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again in a moment.');
    }
    throw error;
  }
}

/** Groq call — primary key first, secondary key on failure, then throws. */
export async function callGroq(
  systemPrompt: string,
  userMessage: string,
  options?: { timeoutMs?: number }
): Promise<string> {
  if (GROQ_API_KEYS.length === 0) {
    throw new Error(
      'SureCV Intelligence is not configured. Add VITE_GROQ_API_KEY to .env and restart the dev server.'
    );
  }

  const errors: unknown[] = [];

  for (let i = 0; i < GROQ_API_KEYS.length; i++) {
    try {
      return await callGroqWithKey(
        GROQ_API_KEYS[i],
        systemPrompt,
        userMessage,
        options
      );
    } catch (error) {
      errors.push(error);
      const hasNext = i < GROQ_API_KEYS.length - 1;
      if (hasNext && isRetryableApiError(error)) {
        console.warn(
          `[Groq] API key ${i + 1} failed (${parseApiError(error).code}), switching to backup key...`
        );
        continue;
      }
      throw error;
    }
  }

  throw errors[errors.length - 1] ?? new Error('Groq request failed');
}

/**
 * Groq (primary + secondary keys) → Gemini when limit/errors occur.
 */
export async function callGroqWithFallback(
  systemPrompt: string,
  userMessage: string,
  options?: { timeoutMs?: number; label?: string }
): Promise<string> {
  const label = options?.label ?? 'AI';
  try {
    return await callGroq(systemPrompt, userMessage, options);
  } catch (groqError) {
    if (!isRetryableApiError(groqError)) {
      throw groqError;
    }
    console.warn(
      `[${label}] Groq limit/error (${parseApiError(groqError).code}), switching to Gemini...`
    );
    return callGeminiText(systemPrompt, userMessage, options);
  }
}

/** Strip markdown fences and quotes from plain-text Groq replies. */
export function extractPlainTextFromGroq(content: string): string {
  let text = content.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```[\w]*\n?/i, '').replace(/\n?```$/i, '')
  }
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1)
  }
  return text.trim()
}

export function safeParseJSON(text: string): unknown {
  if (!text || typeof text !== 'string') {
    throw new Error('Input is not a valid string');
  }

  let cleaned = text.trim();

  // Aggressive markdown removal: look for first { and last } if wrapped in backticks
  if (cleaned.includes('```')) {
    // Find the first opening brace
    const firstBrace = cleaned.indexOf('{');
    // Find the last closing brace
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      // Extract just the JSON object
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }

  cleaned = cleaned.trim();

  // FIX: Escape unescaped newlines and control characters in strings
  // This regex finds strings and replaces unescaped control characters
  cleaned = cleaned.replace(/("(?:[^"\\]|\\.)*")/g, (match) => {
    // For each string, escape control characters
    return match
      .replace(/\n/g, '\\n')      // actual newlines -> \n
      .replace(/\r/g, '\\r')      // actual carriage returns -> \r
      .replace(/\t/g, '\\t')      // actual tabs -> \t
      .replace(/\f/g, '\\f')      // actual form feeds -> \f
      .replace(/\v/g, '\\v');     // actual vertical tabs -> \v
  });

  // Try direct parse
  try {
    const parsed = JSON.parse(cleaned);
    return parsed;
  } catch (err) {
    // If still fails, try to extract JSON object more carefully
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch (innerErr) {
        console.error('[JSON Parser] Failed to parse extracted object:', innerErr instanceof Error ? innerErr.message : String(innerErr));
      }
    }

    // Last resort: try array
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        // fallthrough
      }
    }

    throw new Error(
      `Failed to parse JSON response.\n` +
      `Input length: ${text.length} chars\n` +
      `First 200: ${text.slice(0, 200)}\n` +
      `Last 200: ${text.slice(-200)}`
    );
  }
}

async function callGroqWithRetry(
  systemPrompt: string,
  userMessage: string,
  maxAttempts = 2
): Promise<unknown> {
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const result = await callGroq(systemPrompt, userMessage);
      return safeParseJSON(result);
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) throw error;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }
  throw new Error('Max attempts reached');
}

const ATS_OPTIMIZATION_SYSTEM_PROMPT = `You are SureCv's world-class ATS Resume Optimization Engine using DUAL-AI STRATEGY.

GROQ RESPONSIBILITIES: keyword extraction from JD, trend detection, real-time job market terms, JSON accuracy

CORE RULES (NEVER BREAK):
1. EXACT KEYWORD MATCH — use word-for-word from JD, never synonyms
2. SINGLE COLUMN OUTPUT ONLY — no tables, columns, text boxes  
3. STANDARD SECTION HEADERS: Professional Summary / Work Experience / Skills / Education / Certifications
4. EVERY BULLET = Action Verb + Task + Measurable Result
5. REPLACE ALL WEAK VERBS with power verbs
6. ADD METRICS TO EVERY BULLET
7. KEYWORD DENSITY: 3-8%
8. ATS SCORE TARGET: 80%+

5-DIMENSION ATS SCORING:
TOTAL = (KeywordMatch×0.40) + (FormatScore×0.20) + (ActionVerbScore×0.15) + (QuantifiedBullets×0.15) + (SectionCompleteness×0.10)

POWER VERBS:
LEADERSHIP: Led, Directed, Spearheaded, Championed, Orchestrated
BUILDING: Architected, Engineered, Developed, Built, Launched
IMPROVING: Optimized, Streamlined, Accelerated, Enhanced, Transformed
ACHIEVING: Delivered, Exceeded, Surpassed, Generated, Secured
ANALYZING: Analyzed, Evaluated, Identified, Synthesized, Forecasted
MANAGING: Managed, Coordinated, Oversaw, Administered, Supervised

WEAK VERBS TO REPLACE:
Worked → Engineered/Built/Developed
Helped → Contributed/Supported/Facilitated
Did → Executed/Implemented/Delivered
Participated → Collaborated/Partnered
Assisted → Supported/Enabled

INDUSTRY KEYWORDS TO INJECT IF DETECTED:
TECH: Python, JavaScript, TypeScript, AWS, Azure, Kubernetes, Docker, CI/CD, PostgreSQL, TensorFlow, PyTorch, LLM, RAG, MLOps
FINANCE: Financial modeling, GAAP, IFRS, SOX compliance, Risk management, Bloomberg Terminal, Excel, Power BI, CPA, CFA
HEALTHCARE: HIPAA, HITECH, EHR, Epic, Cerner, HL7, FHIR, Patient outcomes, Care coordination, Evidence-based
MARKETING: SEO, SEM, PPC, Google Ads, Content marketing, A/B testing, CRO, HubSpot, Marketo, ROAS, CAC, LTV

Include a "scoreData" object with display metrics for the results UI.

CRITICAL: The rewrittenResume field in your JSON response must follow this EXACT plain text format with these exact section headers:
[CANDIDATE FULL NAME]
[email] | [phone] | [city] | [linkedin]

PROFESSIONAL SUMMARY
[2-3 sentence summary paragraph]

WORK EXPERIENCE
[Job Title] — [Company Name] | [Start Date] – [End Date]
[City, State]
• [Power verb + achievement + metric]
• [Power verb + achievement + metric]
• [Power verb + achievement + metric]

SKILLS
[Category]: [skill1], [skill2], [skill3]
[Category]: [skill1], [skill2]

EDUCATION
[Degree] — [Institution] | [Year]

CERTIFICATIONS
[Certification Name] — [Issuer] | [Year]

MANDATORY REWRITING RULES:
1. You MUST rewrite EVERY bullet point — no exceptions
2. EVERY bullet must start with a power verb from:
   [Led, Built, Architected, Optimized, Generated, Delivered, Managed, Developed, Increased, Reduced]
3. EVERY bullet must include a metric (%, ₹, #, time)
4. The rewrittenResume MUST be completely different from the original — not just slightly modified
5. Score rule: after score must always be at least 20 points higher than before
6. bulletsImproved must equal total number of bullets rewritten
7. Never output "No changes needed" in analysis_message or rubric_message

Return ONLY valid JSON - no markdown, no backticks, no explanation.
You may append SCORE_DATA:{...} after the JSON with the same scoreData fields if needed.`;

export async function optimizeResume(
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

  const userMessage = `Optimize this resume against the job description using the ATS engine.

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Return ONLY this JSON structure (pure JSON, no markdown):
{
  "atsScore": <0-100>,
  "scoreDimensions": {
    "keywordMatch": <0-100>,
    "formatScore": <0-100>,
    "actionVerbScore": <0-100>,
    "quantifiedBullets": <0-100>,
    "sectionCompleteness": <0-100>
  },
  "scoreLabel": <"Poor"|"Fair"|"Good"|"Excellent">,
  "missingKeywords": [<max 10 exact JD keywords not in resume>],
  "addedKeywords": [<max 10 keywords you added in rewrite>],
  "weakVerbsFound": [<array of {original, replacement}>],
  "bulletsImproved": <number>,
  "metricsAdded": <number>,
  "industryDetected": <"tech"|"finance"|"healthcare"|"marketing"|"general">,
  "recruiterTips": [<3-5 specific tips>],
  "rewrittenResume": "<must strictly follow: name line, contact line with | separators, PROFESSIONAL SUMMARY, WORK EXPERIENCE, SKILLS, EDUCATION, CERTIFICATIONS>",
  "coverLetterPoints": [<3 key points to emphasize>],
  "scoreData": {
    "before": <original ATS 0-100>,
    "after": <optimized ATS 0-100>,
    "keywords_added": <number>,
    "bullets_rewritten": <number>,
    "skills_match_pct": <0-100>,
    "keywords_added_list": ["keyword1"],
    "keywords_missing_list": ["keyword2"],
    "verbs_replaced": [{"from": "Worked", "to": "Developed"}],
    "analysis_message": "<plain language why score is high or what changed>",
    "rubric_message": "<one line about rubric fit>",
    "tips": ["tip1", "tip2", "tip3"]
  }
}`;

  try {
    const response = await callGroq(ATS_OPTIMIZATION_SYSTEM_PROMPT, userMessage, {
      timeoutMs: 90000,
    });
    const jsonPart = extractJsonFromAiResponse(response);
    const parsed = safeParseJSON(jsonPart) as ATSOptimizationResult & {
      scoreData?: Record<string, unknown>;
    };

    // Calculate ATS score first
    const atsScore = Math.round(Math.max(0, Math.min(100, parsed.atsScore || 50)));
    const originalScore = parsed.original_score || Math.max(20, atsScore - 25);
    const optimizedScore = parsed.optimized_score || atsScore;

    // Validate and ensure all required fields
    const structuredResume = enforceResumeStructure(
      parsed.rewrittenResume || '',
      parsed.candidate_name || 'Candidate Name'
    );

    const result: ATSOptimizationResult = {
      atsScore,
      scoreDimensions: {
        keywordMatch: Math.max(0, Math.min(100, parsed.scoreDimensions?.keywordMatch || 0)),
        formatScore: Math.max(0, Math.min(100, parsed.scoreDimensions?.formatScore || 0)),
        actionVerbScore: Math.max(0, Math.min(100, parsed.scoreDimensions?.actionVerbScore || 0)),
        quantifiedBullets: Math.max(0, Math.min(100, parsed.scoreDimensions?.quantifiedBullets || 0)),
        sectionCompleteness: Math.max(0, Math.min(100, parsed.scoreDimensions?.sectionCompleteness || 0)),
      },
      scoreLabel: (parsed.scoreLabel || 'Fair') as 'Poor' | 'Fair' | 'Good' | 'Excellent',
      missingKeywords: Array.isArray(parsed.missingKeywords) ? parsed.missingKeywords.slice(0, 10) : [],
      addedKeywords: Array.isArray(parsed.addedKeywords) ? parsed.addedKeywords.slice(0, 10) : [],
      weakVerbsFound: Array.isArray(parsed.weakVerbsFound) ? parsed.weakVerbsFound : [],
      bulletsImproved: parsed.bulletsImproved || 0,
      metricsAdded: parsed.metricsAdded || 0,
      industryDetected: (parsed.industryDetected || 'general') as 'tech' | 'finance' | 'healthcare' | 'marketing' | 'general',
      recruiterTips: Array.isArray(parsed.recruiterTips) ? parsed.recruiterTips : [],
      rewrittenResume: structuredResume,
      coverLetterPoints: Array.isArray(parsed.coverLetterPoints) ? parsed.coverLetterPoints : [],
      
      // Backward compatibility fields
      original_score: originalScore,
      optimized_score: optimizedScore,
      score_lift: optimizedScore - originalScore,
      candidate_name: parsed.candidate_name || 'You',
      target_role: parsed.target_role || 'Position',
      target_company: parsed.target_company || 'Company',
      keywords_added: parsed.keywords_added || parsed.addedKeywords,
      keywords_missing: parsed.keywords_missing || parsed.missingKeywords,
      ats_compatibility: parsed.ats_compatibility || {
        taleo: Math.round(atsScore * 0.95),
        workday: Math.round(atsScore * 0.92),
        greenhouse: Math.round(atsScore * 0.88),
        lever: Math.round(atsScore * 0.90),
      },
    };

    return enrichOptimizationResult(result, response, parsed.scoreData);
  } catch (error) {
    console.error('Groq optimization error:', error);
    throw error;
  }
}

export type { EnrichedOptimizeResult };

// ── Cover letter prompt ──

const COVER_LETTER_SYSTEM_PROMPT = `You are an expert cover letter writer who has helped 10,000+ candidates land jobs at top companies. You write cover letters that sound genuinely human, not AI-generated.

RULES:
- 3 paragraphs maximum, 200-250 words total
- Paragraph 1: Why THIS company and THIS role
- Paragraph 2: Your most relevant achievement that directly matches their needs
- Paragraph 3: Confident close with CTA
- Use the candidate's actual experience only
- Mirror keywords from the job description
- Sound excited but professional
- NO cliches like "I am writing to express my interest" or "I believe I would be a great fit"
- Start with something specific about the company or role
- Tone: TONE_PLACEHOLDER

Return ONLY the cover letter text. No subject line. No JSON. Just the letter.`;

export async function generateCoverLetter(
  resume: string,
  jobDescription: string,
  tone: 'Professional' | 'Friendly' | 'Formal' = 'Professional'
): Promise<string> {
  const systemPrompt = COVER_LETTER_SYSTEM_PROMPT.replace(
    'TONE_PLACEHOLDER',
    tone
  );
  const userMessage = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}`;
  return callGroqWithFallback(systemPrompt, userMessage, { label: 'Cover letter' });
}

// ── Bullet improver prompt ──

const BULLET_IMPROVER_SYSTEM_PROMPT = `You are a resume bullet point expert.
Rewrite this bullet using the proven formula: Strong Action Verb + Tool/Asset + Scope + Quantified Outcome.

Examples of transformations:
WEAK: "Worked on backend systems"
STRONG: "Engineered 5 REST APIs serving 100K daily requests, reducing response time by 35%"

WEAK: "Helped with customer support"
STRONG: "Resolved 80+ daily customer tickets maintaining 97% CSAT score across 3 channels"

WEAK: "Did data analysis"
STRONG: "Automated weekly sales reports using Python and Pandas, saving 8 hours of manual work per week for a team of 12"

Keep the same factual content. Only improve how it is written. Give exactly 3 alternative versions.

Return ONLY JSON:
{
  "suggestions": ["version 1 here", "version 2 here", "version 3 here"]
}`;

export async function improveBullet(bulletPoint: string): Promise<string[]> {
  const content = await callGroqWithFallback(BULLET_IMPROVER_SYSTEM_PROMPT, bulletPoint, {
    label: 'Bullet improver',
  });
  const parsed = safeParseJSON(content) as BulletSuggestions;
  return parsed.suggestions || [];
}

const SUMMARY_IMPROVER_SYSTEM =
  'You are an expert resume writer who creates compelling professional summaries. Return ONLY the improved summary text — no quotes, markdown, or JSON.';

export async function improveSummaryText(summary: string): Promise<string> {
  const prompt = `Improve this professional summary to be more impactful, concise, and highlight key achievements.
Current summary: "${summary}"

Rules:
- Keep it under 3 sentences
- Start with years of experience or key expertise
- Include quantifiable achievements if possible
- Use power words
- Make it ATS-friendly

Return ONLY the improved summary text, nothing else.`;

  const content = await callGroqWithFallback(SUMMARY_IMPROVER_SYSTEM, prompt, {
    label: 'Summary improver',
  });
  return extractPlainTextFromGroq(content);
}

const BULLET_SINGLE_IMPROVER_SYSTEM =
  'You are a resume bullet point expert. Return ONLY one improved bullet — no quotes, markdown, or JSON.';

export async function improveBulletText(bullet: string): Promise<string> {
  const prompt = `Rewrite this resume bullet point using the XYZ formula (Action + Context + Result).
Current bullet: "${bullet}"

Rules:
- Start with a strong action verb
- Include context (team size, tools, scope)
- Add measurable results (numbers, percentages, improvements)
- Keep it concise (under 25 words ideally)

Return ONLY the improved bullet point, nothing else.`;

  const content = await callGroqWithFallback(BULLET_SINGLE_IMPROVER_SYSTEM, prompt, {
    label: 'Bullet rewrite',
  });
  return extractPlainTextFromGroq(content);
}

// ── Job summary prompt ──

export async function summarizeJobDescription(
  jobDescription: string
): Promise<JobSummary> {
  const systemPrompt = `Extract and summarize key information from this job description.
Return ONLY JSON:
{
  "job_title": "Software Engineer",
  "company": "Google",
  "key_skills": ["Python", "AWS", "REST APIs"],
  "experience_required": "3+ years",
  "key_responsibilities": ["Build APIs", "Lead team"],
  "nice_to_have": ["Docker", "Kubernetes"]
}`;

  const content = await callGroqWithFallback(systemPrompt, jobDescription, {
    label: 'Job summary',
  });
  const parsed = safeParseJSON(content) as JobSummary;

  return {
    job_title: parsed.job_title || 'Unknown',
    company: parsed.company || 'Unknown',
    key_skills: Array.isArray(parsed.key_skills) ? parsed.key_skills : [],
    experience_required: parsed.experience_required || '',
    key_responsibilities: Array.isArray(parsed.key_responsibilities)
      ? parsed.key_responsibilities
      : [],
    nice_to_have: Array.isArray(parsed.nice_to_have) ? parsed.nice_to_have : [],
  };
}
