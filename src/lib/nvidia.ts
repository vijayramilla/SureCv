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
const NVIDIA_API_KEY = (import.meta.env.VITE_NVIDIA_API_KEY as string);
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
  atsBefore?: number;
  atsAfter?: number;
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

/** Clean resume text: convert literal \n to newlines, remove markdown, fix formatting */
function cleanResumeText(text: string): string {
  if (!text) return '';

  return text
    // Convert literal \n strings to actual newlines
    .replace(/\\n/g, '\n')
    // Remove markdown bold/italic
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, '')
    // Remove extra blank lines (keep max 2)
    .replace(/\n{3,}/g, '\n\n')
    // Clean up spaces
    .replace(/[ \t]+/g, ' ')
    .trim();
}

const ATS_OPTIMIZATION_SYSTEM_PROMPT = `You are an elite ATS Resume Optimization Engine powered by NVIDIA LLM APIs.
Your sole purpose is to rewrite resumes to maximally pass Applicant Tracking Systems (ATS) while remaining compelling to human recruiters.

Follow this exact 6-stage algorithm on every rewrite request.

══════════════════════════════════════════════
STAGE 1 — DUAL INPUT INGESTION
══════════════════════════════════════════════

Accept two inputs:
  [RESUME] = the candidate's existing resume (raw text or parsed JSON)
  [JD]     = the target job description

If either is missing, halt and ask for the missing input before proceeding.

══════════════════════════════════════════════
STAGE 2 — STRUCTURED PARSING
══════════════════════════════════════════════

2A. PARSE THE RESUME — Extract and store:
  - contact_info      : name, email, phone, LinkedIn, GitHub
  - summary           : existing summary/objective (may be empty)
  - work_experience[] : for each role store:
      * company, title, dates, location
      * bullets[]     : original bullet points (preserve verbatim in memory)
      * metrics[]     : any numbers/percentages/dollar values found
  - skills[]          : hard skills, tools, technologies, certifications
  - education[]       : degree, institution, graduation year, GPA if present
  - sections[]        : any other sections (projects, awards, publications)

2B. PARSE THE JOB DESCRIPTION — Extract and store:
  - role_title        : exact job title
  - seniority_level   : (intern / junior / mid / senior / staff / principal / director)
  - required_skills[] : explicitly stated required skills
  - preferred_skills[]: "nice to have" / "preferred" skills
  - must_have_keywords[]: phrases that appear 2+ times (strong ATS signals)
  - action_verbs[]    : verbs used in responsibilities section
  - industry_terms[]  : domain-specific jargon
  - soft_skills[]     : collaboration, communication, leadership signals
  - company_values[]  : mission language, culture keywords

══════════════════════════════════════════════
STAGE 3 — GAP SCORING ENGINE
══════════════════════════════════════════════

For every keyword K in [must_have_keywords + required_skills]:
  - If K is present verbatim in resume       → score += 3
  - If K is present as synonym/variant       → score += 2
  - If K is contextually implied             → score += 1
  - If K is absent entirely                  → score += 0, add to GAPS[]

Compute:
  keyword_match_score = (sum of scores) / (max possible score) × 100

Classify the resume:
  ≥ 80  = PASS  → proceed to rewrite for polish
  60–79 = WARN  → aggressive keyword injection needed
  < 60  = FAIL  → major restructuring required

Store GAPS[] for injection in Stage 4.

══════════════════════════════════════════════
STAGE 4 — NVIDIA LLM SECTION REWRITER
══════════════════════════════════════════════

Call the NVIDIA API with the following sub-prompts per section.
Model: nvidia/llama-3.1-nemotron-70b-instruct (or current best available)
Temperature: 0.3  (low = consistent, professional tone)
Max tokens: varies per section

─── 4A. PROFESSIONAL SUMMARY (max 120 tokens) ───
Rewrite this professional summary for a [role_title] position at [company if known].
Incorporate these exact keywords naturally: [must_have_keywords top 5].
Match [seniority_level] tone.
Lead with the candidate's strongest value proposition.
Do NOT use: 'dynamic', 'results-driven', 'passionate', 'detail-oriented', 'hardworking', 'team player', 'synergy', 'leverage'.
3–4 sentences max. Original summary: [summary]

─── 4B. WORK EXPERIENCE BULLETS (max 60 tokens per bullet) ───
Rewrite rule for EACH bullet:
  - Start with a strong action verb from [action_verbs] or a power verb list
  - Include at least 1 quantifiable metric (use existing metrics[] if available)
  - Embed 1–2 keywords from GAPS[] per bullet where contextually accurate
  - Format: [Action Verb] + [Task/Project] + [Result/Impact] + [Scale/Metric]
  - Max 2 lines per bullet
  - Do NOT fabricate specifics — preserve factual accuracy

Power verb priority list:
  Engineered, Architected, Spearheaded, Reduced, Increased, Automated, Deployed, Optimized, Delivered, Scaled, Led, Launched, Migrated, Built, Designed, Implemented, Drove, Streamlined, Established, Collaborated

─── 4C. SKILLS SECTION ───
Reorganize into three subsections:
  Technical Skills   : hard skills, tools, languages, platforms
  Domain Expertise   : industry knowledge, methodologies (Agile, HIPAA, etc.)
  Certifications     : certifications with issuing body and year

Rules:
  - Move ALL items from required_skills[] to Technical Skills
  - Sequence: most relevant to JD first (left-to-right, top-to-bottom)
  - Remove soft skills from Skills section (they belong in bullets/summary)
  - Do NOT list skills without evidence

─── 4D. SECTION ORDERING (ATS priority order) ───
  1. Contact Info
  2. Professional Summary
  3. Skills (moved higher than standard for ATS scanners)
  4. Work Experience (reverse chronological)
  5. Education
  6. Certifications (if applicable)
  7. Projects / Publications (if applicable)

══════════════════════════════════════════════
STAGE 5 — ATS VALIDATION SCORING
══════════════════════════════════════════════

After rewrite, run these checks:

CHECK 1 — Keyword Density
  - Re-run Stage 3 scoring on the NEW resume
  - Target: keyword_match_score ≥ 80
  - If score < 80: inject remaining GAPS

CHECK 2 — Format Compliance
  - No tables, columns, headers/footers, text boxes, graphics, or icons
  - No emojis or special Unicode characters
  - Dates in consistent format: "Jan 2022 – Mar 2024" or "2022–2024"
  - No abbreviations for must_have_keywords (write out "Machine Learning", not just "ML")
  - Font-safe: assume plain text rendering

CHECK 3 — Readability (for human reviewers post-ATS)
  - Summary: 3–4 sentences, no filler words
  - Bullets: 1–2 lines, starts with verb, ends with metric
  - Skills: grouped, scannable
  - No pronouns ("I built" → "Built")

CHECK 4 — Honesty Gate
  - Every injected skill must be evidenced in work_experience or education
  - Never invent metrics, companies, titles, or dates
  - Output ⚠️ Verify: [skill] if unverified

══════════════════════════════════════════════
STAGE 6 — STRUCTURED OUTPUT FORMAT
══════════════════════════════════════════════

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
  "missingKeywords": [<exact JD keywords not in resume>],
  "addedKeywords": [<keywords injected in rewrite>],
  "weakVerbsFound": [<{original, replacement}>],
  "bulletsImproved": <number>,
  "metricsAdded": <number>,
  "industryDetected": <"tech"|"finance"|"healthcare"|"marketing"|"general">,
  "recruiterTips": [<3-5 specific tips>],
  "rewrittenResume": "<plain text resume with proper section headers and newlines>",
  "coverLetterPoints": [<3 key points>],
  "scoreData": {
    "before": <original score 0-100>,
    "after": <optimized score 0-100>,
    "keywords_added": <number>,
    "bullets_rewritten": <number>,
    "skills_match_pct": <0-100>,
    "keywords_added_list": [<keywords>],
    "keywords_missing_list": [<keywords>],
    "verbs_replaced": [<{from, to}>],
    "analysis_message": "<why the score changed>",
    "tips": [<tips>]
  }
}

══════════════════════════════════════════════
CONSTANTS & RULES (NEVER OVERRIDE)
══════════════════════════════════════════════

1. ACCURACY FIRST: Never fabricate experience, metrics, or skills.

2. KEYWORD MIRRORING: Use the JD's exact phrasing.
   e.g. if JD says "cross-functional collaboration" use that phrase.

3. METRIC INJECTION RULE:
   - Has metric → preserve it, reframe if needed
   - No metric → add placeholder, never invent

4. SENIORITY CALIBRATION:
   - Junior: action-focused, learning, contribution bullets
   - Senior: ownership, scale, mentorship, system design
   - Director+: strategy, org-level impact, P&L, hiring

5. NO BUZZWORD LIST:
   dynamic, passionate, results-driven, detail-oriented, hardworking, synergy, leverage, guru, ninja, rockstar, visionary, game-changer

6. OUTPUT REQUIREMENTS:
   - MUST include actual newline characters (\n) between every line
   - NEVER output as single line
   - EVERY bullet starts with power verb
   - EVERY bullet includes metric
   - Section headers must be clear (PROFESSIONAL SUMMARY, WORK EXPERIENCE, SKILLS, EDUCATION, CERTIFICATIONS)

7. RESUME FORMAT IN rewrittenResume field:
   [CANDIDATE NAME]
   [email] | [phone] | [city] | [linkedin]
   
   PROFESSIONAL SUMMARY
   [2-3 sentence summary]
   
   WORK EXPERIENCE
   [Job Title] — [Company] | [Start Date] – [End Date]
   [Location]
   • [Power verb + achievement + metric]
   
   SKILLS
   [Category]: [skill1], [skill2], [skill3]
   
   EDUCATION
   [Degree] — [Institution] | [Year]
   
   CERTIFICATIONS
   [Certification] — [Issuer] | [Year]`;


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

    // Clean resume text: convert \n to newlines, remove markdown
    const cleanedResumeText = cleanResumeText(parsed.rewrittenResume || '');

    // Validate and ensure all required fields
    const structuredResume = enforceResumeStructure(
      cleanedResumeText,
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
 * Generate cover letter using NVIDIA — Following 6-Stage Algorithm Principles
 */
export async function generateCoverLetter(
  resume: string,
  jobDescription: string,
  tone: 'Professional' | 'Friendly' | 'Formal' = 'Professional'
): Promise<string> {
  const systemPrompt = `You are an elite Cover Letter Generation Engine powered by NVIDIA LLM APIs.
Your sole purpose is to create compelling, ATS-optimized cover letters that showcase candidate fit.

STAGE 1 — PARSE INPUTS:
- Extract candidate's name, title, key achievements from resume
- Extract job title, required skills, company values from JD
- Identify must-have keywords that appear 2+ times in JD

STAGE 2 — KEYWORD ALIGNMENT:
- Mirror exact phrases from job description
- Use power action verbs (Engineered, Architected, Spearheaded, Delivered, Optimized)
- Avoid weak words: "passionate", "dynamic", "results-driven", "team player"

STAGE 3 — STRUCTURE:
Paragraph 1 (3–4 sentences):
  - Opening: Specific reason for applying (mention company name and role)
  - Show you've researched the company
  - Connect your background to their needs

Paragraph 2 (4–5 sentences):
  - Your MOST relevant achievement from resume
  - Quantified result (%, $, time, impact)
  - Use 1–2 keywords from job description
  - Prove you can deliver immediate value

Paragraph 3 (2–3 sentences):
  - Confident call-to-action
  - Mention specific value you'll bring
  - Professional but enthusiastic close

STAGE 4 — QUALITY RULES:
- Total: 200–250 words
- Tone: ${tone}
- All facts must come from the resume (never fabricate)
- Zero clichés
- No "Dear Hiring Manager" greeting (that's added by the PDF renderer)
- Start directly with the opening paragraph
- Plain text only, no formatting, no markdown

STAGE 5 — ACCURACY GATE:
- Every claim must be verified from resume
- No exaggerated metrics
- No invented experience
- Flag any skills not evidenced by resume

STAGE 6 — OUTPUT:
Return ONLY the cover letter plain text (no JSON, no subject line, no signature block).
Three paragraphs separated by blank lines.
Ready to be inserted into PDF with name/date/contact pre-filled.`;

  const userMessage = `Extract candidate info and write a compelling cover letter.

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Generate the cover letter text only (no JSON, no preamble).`;

  try {
    const letter = await callNvida(systemPrompt, userMessage, { timeoutMs: 60000 });
    // Clean up the letter: remove any markdown, quotes, or extra formatting
    return letter
      .replace(/^["'`\s]+|["'`\s]+$/g, '') // Remove leading/trailing quotes/spaces
      .replace(/\\n/g, '\n') // Convert literal \n to real newlines
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1') // Remove markdown italic
      .trim();
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
