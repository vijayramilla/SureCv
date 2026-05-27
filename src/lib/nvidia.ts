/**
 * NVIDIA API Integration for Resume Optimization
 * Uses NVIDIA's LLaMA 3.3-70B model via OpenAI SDK
 */

import {
  enrichOptimizationResult,
  extractJsonFromAiResponse,
  type EnrichedOptimizeResult,
} from './scoreData';
import { enforceResumeStructure } from './enforceResumeStructure';
import { isRetryableApiError, parseApiError } from './apiErrors';

// NVIDIA API Configuration
const NVIDIA_API_KEY = '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';
const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
const NVIDIA_MODEL = 'meta/llama-3.3-70b-instruct';

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

  // Backward compatibility fields
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
  optimized_resume?: string;
}

export type OptimizeResult = ATSOptimizationResult;

/**
 * Call NVIDIA API with LLaMA 3.3-70B model
 * Includes automatic retry logic for rate limits
 */
async function callNvida(
  systemPrompt: string,
  userMessage: string,
  options?: { timeoutMs?: number }
): Promise<string> {
  if (!NVIDIA_API_KEY) {
    throw new Error(
      'NVIDIA API key not configured. Please check your environment setup.'
    );
  }

  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutMs = options?.timeoutMs ?? 60000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${NVIDIA_BASE_URL}/chat/completions`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NVIDIA_API_KEY}`,
        },
        body: JSON.stringify({
          model: NVIDIA_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.2,
          top_p: 0.7,
          max_tokens: 4096,
          stream: false,
        }),
      });

      clearTimeout(timeout);

      if (response.status === 401) {
        throw new Error(
          'NVIDIA API authentication failed. Please contact support.'
        );
      }

      const errorData = !response.ok
        ? await response.json().catch(() => ({}))
        : null;
      const errMsg =
        (errorData as { error?: { message?: string } })?.error?.message || '';

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit - extract wait time and retry
          const retryAfter = response.headers.get('retry-after');
          const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : Math.min(3 + attempt * 2, 10);
          
          if (attempt < maxRetries) {
            console.warn(
              `[NVIDIA] Rate limited (attempt ${attempt + 1}/${maxRetries + 1}). Waiting ${waitSeconds}s...`
            );
            await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
            continue; // Retry
          } else {
            throw new Error(
              `NVIDIA API rate limit reached after ${maxRetries + 1} attempts. Please wait and try again.`
            );
          }
        }
        if (response.status === 503) {
          throw new Error(
            'NVIDIA API service temporarily unavailable. Please try again in a moment.'
          );
        }
        throw new Error(errMsg || `API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data.choices?.[0]?.message?.content) {
        throw new Error(
          'Empty response from NVIDIA API. Please try again.'
        );
      }

      return data.choices[0].message.content;
    } catch (error: unknown) {
      clearTimeout(timeout);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('NVIDIA API request timed out. Please try again.');
      }
      
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // If not a rate limit error or we've exhausted retries, throw immediately
      if (!lastError.message.includes('429') && !lastError.message.includes('rate limit')) {
        throw lastError;
      }
      
      // If we have more retries, continue
      if (attempt < maxRetries) {
        continue;
      }
    }
  }

  throw lastError || new Error('NVIDIA API request failed after retries.');
}

/** Safe JSON parsing utility */
export function safeParseJSON(text: string): unknown {
  let cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // continue to fallback
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // continue to fallback
    }
  }

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      // continue
    }
  }

  throw new Error(
    'Could not parse API response as JSON. Raw: ' + text.slice(0, 200)
  );
}

const ATS_OPTIMIZATION_SYSTEM_PROMPT = `You are SureCV's world-class ATS Resume Optimization Engine using advanced AI analysis.

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
2. EVERY bullet must start with a power verb
3. EVERY bullet must include a metric (%, ₹, #, time)
4. The rewrittenResume MUST be completely different from the original
5. Score rule: optimized score must always be at least 20 points higher than original
6. bulletsImproved must equal total number of bullets rewritten
7. Never output "No changes needed" 

Return ONLY valid JSON - no markdown, no backticks, no explanation.`;

/**
 * Optimize resume for ATS using NVIDIA LLaMA 3.3-70B
 */
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

  const userMessage = `Optimize this resume against the job description using ATS best practices.

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
    "analysis_message": "<why the score is high or what changed>",
    "rubric_message": "<one line about rubric fit>",
    "tips": ["tip1", "tip2", "tip3"]
  }
}`;

  try {
    const response = await callNvida(ATS_OPTIMIZATION_SYSTEM_PROMPT, userMessage, {
      timeoutMs: 90000,
    });

    const jsonPart = extractJsonFromAiResponse(response);
    const parsed = safeParseJSON(jsonPart) as ATSOptimizationResult & {
      scoreData?: Record<string, unknown>;
    };

    // Calculate ATS score
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
    console.error('NVIDIA API optimization error:', error);
    throw error;
  }
}

/**
 * Generate cover letter using NVIDIA
 */
export async function generateCoverLetter(
  resume: string,
  jobDescription: string,
  tone: 'Professional' | 'Friendly' | 'Formal' = 'Professional'
): Promise<string> {
  const systemPrompt = `You are an expert cover letter writer who has helped thousands of candidates land jobs at top companies. 

RULES:
- 3 paragraphs maximum, 200-250 words total
- Paragraph 1: Why THIS company and THIS role (specific reasons)
- Paragraph 2: Your most relevant achievement that directly matches their needs
- Paragraph 3: Confident close with call-to-action
- Use the candidate's actual experience only
- Mirror keywords from the job description
- Sound excited but professional with ${tone} tone
- NO cliches like "I am writing to express my interest"
- Start with something specific about the company or role

Return ONLY the cover letter text. No subject line. No JSON. Just the letter.`;

  const userMessage = `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}`;

  try {
    return await callNvida(systemPrompt, userMessage, { timeoutMs: 60000 });
  } catch (error) {
    console.error('NVIDIA cover letter generation error:', error);
    throw error;
  }
}

/**
 * Improve bullet points using NVIDIA
 */
export async function improveBulletPoint(bullet: string): Promise<string[]> {
  const systemPrompt = `You are a resume bullet point expert. Rewrite the given bullet using: Action Verb + Tool/Asset + Scope + Quantified Outcome.

Examples:
WEAK: "Worked on backend systems"
STRONG: "Engineered 5 REST APIs serving 100K daily requests, reducing response time by 35%"

WEAK: "Helped with customer support"
STRONG: "Resolved 80+ daily customer tickets maintaining 97% CSAT score"

Keep factual content. Only improve how it's written. Give exactly 3 strong alternatives.

Return ONLY valid JSON array of 3 improved bullet strings:
["improved_bullet_1", "improved_bullet_2", "improved_bullet_3"]`;

  const userMessage = `Original bullet: "${bullet}"`;

  try {
    const response = await callNvida(systemPrompt, userMessage);
    const parsed = safeParseJSON(response) as string[];
    return Array.isArray(parsed) ? parsed.slice(0, 3) : [bullet];
  } catch (error) {
    console.error('NVIDIA bullet improvement error:', error);
    return [bullet];
  }
}

export type { EnrichedOptimizeResult };
