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

import { getApiBase } from './apiBase';

// All optimization traffic goes through the Express proxy (keys stay on Railway only).
const API_BASE = getApiBase();

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
 * Optimize resume for ATS using backend proxy
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

  try {
    const response = await fetch(`${API_BASE}/api/optimize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: resume,
        jobDescription: jobDescription,
        userInstructions: '',
        resumeLength: 'auto'
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Optimization failed' }));
      throw new Error(err.error || `API error: ${response.status}`);
    }

    const data = await response.json();

    // Validate and ensure all required fields
    const structuredResume = enforceResumeStructure(
      data.rewrittenResume || '',
      'Candidate Name'
    );

    const result: ATSOptimizationResult = {
      atsScore: Math.max(0, Math.min(100, data.atsAfter || 50)),
      atsBefore: data.atsBefore || 30,
      atsAfter: data.atsAfter || 50,
      scoreDimensions: {
        keywordMatch: Math.max(0, Math.min(100, data.scoreDimensions?.keywordMatch || 0)),
        formatScore: Math.max(0, Math.min(100, data.scoreDimensions?.formatScore || 0)),
        actionVerbScore: Math.max(0, Math.min(100, data.scoreDimensions?.actionVerbScore || 0)),
        quantifiedBullets: Math.max(0, Math.min(100, data.scoreDimensions?.quantifiedBullets || 0)),
        sectionCompleteness: Math.max(0, Math.min(100, data.scoreDimensions?.sectionCompleteness || 0)),
      },
      scoreLabel: (data.scoreLabel || 'Fair') as 'Poor' | 'Fair' | 'Good' | 'Excellent',
      missingKeywords: Array.isArray(data.missingKeywords) ? data.missingKeywords.slice(0, 10) : [],
      addedKeywords: Array.isArray(data.addedKeywords) ? data.addedKeywords.slice(0, 10) : [],
      weakVerbsFound: Array.isArray(data.weakVerbsReplaced) 
        ? data.weakVerbsReplaced.map((item: any) => ({ 
            original: item.original, 
            replacement: item.replacement 
          })) 
        : [],
      bulletsImproved: data.bulletsRewritten || 0,
      metricsAdded: data.metricsAdded || 0,
      industryDetected: (data.industryDetected || 'general') as 'tech' | 'finance' | 'healthcare' | 'marketing' | 'general',
      recruiterTips: Array.isArray(data.recruiterTips) ? data.recruiterTips : [],
      rewrittenResume: structuredResume,
      coverLetterPoints: Array.isArray(data.coverLetterPoints) ? data.coverLetterPoints : [],

      // Backward compatibility fields
      original_score: data.atsBefore || 30,
      optimized_score: data.atsAfter || 50,
      score_lift: (data.atsAfter || 50) - (data.atsBefore || 30),
      candidate_name: 'You',
      target_role: 'Position',
      target_company: 'Company',
      keywords_added: Array.isArray(data.addedKeywords) ? data.addedKeywords : [],
      keywords_missing: Array.isArray(data.missingKeywords) ? data.missingKeywords : [],
      ats_compatibility: {
        taleo: Math.round((data.atsAfter || 50) * 0.95),
        workday: Math.round((data.atsAfter || 50) * 0.92),
        greenhouse: Math.round((data.atsAfter || 50) * 0.88),
        lever: Math.round((data.atsAfter || 50) * 0.90),
      },
    };

    return enrichOptimizationResult(result, JSON.stringify(data), {});
  } catch (error) {
    console.error('Resume optimization error:', error);
    throw error;
  }
}

/**
 * Generate cover letter using backend proxy
 */
export async function generateCoverLetter(
  resume: string,
  jobDescription: string,
  jobTitle: string = '',
  companyName: string = '',
  tone: 'professional' | 'confident' | 'enthusiastic' | 'formal' = 'professional'
): Promise<string> {
  try {
    const response = await fetch(`${API_BASE}/api/cover-letter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: resume,
        jobDescription: jobDescription,
        jobTitle: jobTitle || 'the position',
        companyName: companyName || 'the company',
        tone: tone
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Generation failed' }));
      throw new Error(err.error || 'Cover letter generation failed');
    }

    const data = await response.json();
    return data.coverLetter || '';
  } catch (error) {
    console.error('Cover letter generation error:', error);
    throw error;
  }
}

/** Bullet improvement runs server-side only; use full optimize for AI rewrites. */
export async function improveBulletPoint(bullet: string): Promise<string[]> {
  return [bullet];
}

export type { EnrichedOptimizeResult };
