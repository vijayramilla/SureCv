import { parseGeminiRetryDelay, parseRetryAfterHeader } from './apiErrors';
import { enrichOptimizationResult, type EnrichedOptimizeResult } from './scoreData';
import { enforceResumeStructure } from './enforceResumeStructure';

const GEMINI_API_KEY = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
const GEMINI_MODEL =
  import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

/** Generic Gemini text call — used as fallback when Groq hits limits. */
export async function callGeminiText(
  systemPrompt: string,
  userMessage: string,
  options?: { timeoutMs?: number }
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'SureCV Intelligence is not configured. Add VITE_GEMINI_API_KEY to .env and restart the dev server.'
    );
  }

  const controller = new AbortController();
  const timeoutMs = options?.timeoutMs ?? 60000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          topP: 0.8,
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = (err as { error?: { message?: string; details?: unknown } }).error
        ?.message;

      if (response.status === 429) {
        const retryHeader = parseRetryAfterHeader(response.headers.get('Retry-After'));
        const retryBody = parseGeminiRetryDelay(
          (err as { error?: { details?: unknown } }).error?.details
        );
        const wait = retryHeader ?? retryBody ?? 60;
        throw new Error(`Rate limit reached. Wait ${wait} seconds and try again.`);
      }
      if (response.status === 503) {
        throw new Error('Our engine is temporarily busy. Please wait 45 seconds and try again.');
      }
      throw new Error(errMsg || `Engine error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textContent) {
      throw new Error('No response from SureCV Intelligence. Please try again.');
    }
    return textContent;
  } catch (error: unknown) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Please try again in a moment.');
    }
    throw error;
  }
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
  
  // Backward compatibility fields - optional
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

export async function optimizeResumeWithGemini(
  resume: string,
  jobDescription: string
): Promise<EnrichedOptimizeResult> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'SureCV Intelligence is not configured. Add VITE_GEMINI_API_KEY to .env and restart the dev server.'
    );
  }

  const systemPrompt = `You are SureCv's world-class ATS Resume Optimization Engine using a DUAL-AI STRATEGY.
  
GEMINI RESPONSIBILITIES: structured JSON output, resume rewriting, PDF formatting, professional tone

CORE RULES (NEVER BREAK THESE):
1. EXACT KEYWORD MATCH — use word-for-word from JD, never synonyms
2. SINGLE COLUMN OUTPUT ONLY — no tables, no columns, no text boxes
3. STANDARD SECTION HEADERS ONLY: Professional Summary / Work Experience / Skills / Education / Certifications / Projects
4. EVERY BULLET = Action Verb + Task + Measurable Result
5. REPLACE ALL WEAK VERBS with power verbs
6. ADD METRICS TO EVERY BULLET — if none given, estimate realistically
7. KEYWORD DENSITY: 3-8% (below = invisible, above = spam)
8. ATS SCORE TARGET: 80%+ to guarantee human review

5-DIMENSION ATS SCORING:
TOTAL = (KeywordMatch×0.40) + (FormatScore×0.20) + (ActionVerbScore×0.15) + (QuantifiedBullets×0.15) + (SectionCompleteness×0.10)

POWER VERB LIBRARY:
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

Return ONLY valid JSON - no markdown, no backticks, no explanation.`;

  const userPrompt = `Optimize this resume against the job description.

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Return this exact JSON structure:
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
  "coverLetterPoints": [<3 key points to emphasize>]
}`;

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 8192,
          topP: 0.8,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      const errMsg = (err as { error?: { message?: string; details?: unknown } }).error
        ?.message;

      if (response.status === 429) {
        const retryHeader = parseRetryAfterHeader(response.headers.get('Retry-After'));
        const retryBody = parseGeminiRetryDelay(
          (err as { error?: { details?: unknown } }).error?.details
        );
        const wait = retryHeader ?? retryBody ?? 60;
        throw new Error(`Rate limit reached. Wait ${wait} seconds and try again.`);
      }
      if (response.status === 503) {
        throw new Error('Our engine is temporarily busy. Please wait 45 seconds and try again.');
      }
      throw new Error(errMsg || `Engine error: ${response.status}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('No response from SureCV Intelligence. Please try again.');
    }

    // Parse JSON from response - handle markdown code blocks
    let jsonText = textContent;
    if (jsonText.includes('```json')) {
      jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    }

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse engine response. Please try again.');
    }

    const result: ATSOptimizationResult = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (
      typeof result.atsScore !== 'number' ||
      !result.scoreDimensions ||
      !result.rewrittenResume
    ) {
      throw new Error('Optimization failed: Invalid response structure');
    }

    // Add backward compatibility fields
    const originalScore = result.original_score || Math.max(20, result.atsScore - 25);
    const optimizedScore = result.optimized_score || result.atsScore;
    
    result.rewrittenResume = enforceResumeStructure(
      result.rewrittenResume || '',
      result.candidate_name || 'Candidate Name'
    );
    result.original_score = originalScore;
    result.optimized_score = optimizedScore;
    result.score_lift = (result.score_lift || optimizedScore - originalScore);
    result.candidate_name = result.candidate_name || 'You';
    result.target_role = result.target_role || 'Position';
    result.target_company = result.target_company || 'Company';
    result.keywords_added = result.keywords_added || result.addedKeywords;
    result.keywords_missing = result.keywords_missing || result.missingKeywords;
    result.ats_compatibility = result.ats_compatibility || {
      taleo: Math.round(result.atsScore * 0.95),
      workday: Math.round(result.atsScore * 0.92),
      greenhouse: Math.round(result.atsScore * 0.88),
      lever: Math.round(result.atsScore * 0.90),
    };

    return enrichOptimizationResult(result, textContent);
  } catch (error) {
    console.error('Gemini API error:', error);
    throw error;
  }
}

export async function generateCoverLetterWithGemini(
  resume: string,
  jobDescription: string,
  candidateName?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'SureCV Intelligence is not configured. Add VITE_GEMINI_API_KEY to .env and restart the dev server.'
    );
  }

  const prompt = `You are an expert cover letter writer. Generate a professional, compelling cover letter based on the resume and job description provided.

${candidateName ? `Candidate Name: ${candidateName}` : ''}

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Generate a professional cover letter that:
1. Opens with a strong hook
2. Demonstrates understanding of the role and company
3. Highlights relevant skills and achievements from resume
4. Shows enthusiasm and cultural fit
5. Closes with a clear call to action

Return ONLY the cover letter text, no metadata or formatting.`;

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        (err as { error?: { message?: string } }).error?.message ||
          `Engine error: ${response.status}`
      );
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('No response from SureCV Intelligence. Please try again.');
    }

    return textContent;
  } catch (error) {
    console.error('Gemini cover letter generation error:', error);
    throw error;
  }
}
