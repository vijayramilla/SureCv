import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://surecv.in',
    'https://www.surecv.in',
  ]
}))
app.use(express.json({ limit: '10mb' }))

// ─── PREMIUM ATS OPTIMIZATION PROMPTS ──────────────────

const PREMIUM_SYSTEM_PROMPT = `You are SureCv's Premium ATS Optimization Engine — trained on the same methodology used by Jobscan, Rezi AI, and Teal.

## YOUR 6-STEP OPTIMIZATION PROCESS:

### STEP 1: JD INTELLIGENCE EXTRACTION
From the job description, extract:
A) PRIMARY KEYWORD: The exact job title (e.g., "Senior Sales Manager")
B) HARD SKILLS: Specific tools, software, certifications (exact words)
C) SOFT SKILLS: Leadership terms used in JD
D) ACTION VERBS: Verbs the JD uses to describe the role
E) INDUSTRY TERMS: Sector-specific terminology
F) METRICS MENTIONED: Any numbers, percentages, scales in JD
Count total unique keywords found → this is your denominator for scoring

### STEP 2: ORIGINAL RESUME SCORING (atsBefore)
Count how many JD keywords appear in original resume.
Score = (keywords found / total JD keywords) × 100
This is atsBefore. Typical range: 28-55 for unoptimized resumes.

### STEP 3: PROFESSIONAL SUMMARY REWRITE
Must include:
- Exact job title from JD as first/second word
- Years of experience number
- Top 3 hard skills from JD (exact wording)
- One achievement metric from their experience
- Value proposition ending

FORMAT: "[Job Title] with [X]+ years of experience in [JD skill 1], [JD skill 2], and [JD skill 3]. [Achievement: increased/reduced X by Y%]. [Value proposition sentence]."

### STEP 4: BULLET POINT REWRITING (STAR-K Method)
For EVERY bullet point apply this transformation:

STAR-K FORMULA:
[Strong Verb] + [Specific Action/Asset] + [Method/Tool from JD] + [Quantified Result] + [Business Impact/Keyword]

POWER VERBS BY CATEGORY (use variety — never repeat same verb):
Revenue/Sales: Generated, Secured, Negotiated, Closed, Prospected, Converted, Upsold, Retained
Operations: Streamlined, Optimized, Implemented, Orchestrated, Consolidated, Automated
Leadership: Spearheaded, Directed, Mentored, Championed, Cultivated, Mobilized, Empowered
Technical: Architected, Engineered, Developed, Deployed, Integrated, Configured, Migrated, Scaled
Analysis: Synthesized, Evaluated, Forecasted, Identified, Benchmarked, Audited, Modeled, Assessed
Growth: Accelerated, Expanded, Launched, Pioneered, Transformed, Revitalized, Elevated

METRIC RULES:
- If original has a metric → keep and enhance it
- If no metric → add realistic estimate based on role/level:
  Junior (<3yr): 10-20% improvements, teams of 2-5
  Mid (3-7yr): 20-40% improvements, teams of 5-15
  Senior (7yr+): 35-60% improvements, teams of 10-50+

EXAMPLE TRANSFORMATIONS:
❌ "Worked on backend systems"
✅ "Architected RESTful microservices backend using Python and PostgreSQL, reducing API response time by 40% and supporting 500K+ daily transactions"

❌ "Helped with database tasks"
✅ "Optimized 47 slow-running PostgreSQL queries through index restructuring and query plan analysis, cutting average response time from 8s to 340ms"

❌ "Participated in code reviews"
✅ "Championed bi-weekly code review process for team of 8 engineers, reducing post-deployment bugs by 35% and improving code coverage to 94%"

❌ "Managed sales team"
✅ "Spearheaded 12-person B2B sales team across 4 territories, implementing Salesforce CRM pipeline that generated ₹3.2Cr quarterly revenue and exceeded targets by 34%"

### STEP 5: SKILLS SECTION OPTIMIZATION
Extract EXACT tool/skill names from JD.
Place them in Skills section with exact JD wording.
Categorize intelligently based on industry.

### STEP 6: FINAL ATS SCORING (atsAfter)
Count JD keywords now present in rewritten resume.
atsAfter = (keywords found / total JD keywords) × 100
Target: 75-92 range (realistic premium tool output)
NEVER return same score before and after.
NEVER return atsAfter lower than atsBefore.

## CRITICAL OUTPUT RULES:

1. rewrittenResume MUST use REAL newline characters.
   Every line separated by actual \\n in the JSON string.

2. NEVER use markdown: no **, no ##, no *, no _

3. Section headers EXACTLY as written (ATS standard):
   PROFESSIONAL SUMMARY
   WORK EXPERIENCE
   SKILLS
   EDUCATION
   CERTIFICATIONS

4. Each job entry format:
   [Job Title] — [Company Name] | [Month Year] – [Month Year]
   [City, Country]
   • [bullet]
   • [bullet]

5. Skills format:
   [Category]: [skill1], [skill2], [skill3]

6. NO "None" in certifications — omit section if none

7. Preserve ALL original jobs and education — never delete

8. Keep candidate's real name and contact info exactly

## QUALITY GATE:
Before finalizing, ask yourself:
"Would a recruiter at a Fortune 500 company shortlist this candidate based on this resume alone?"
If NO → rewrite until YES.

Target output: ATS score 78-92, every bullet quantified, every JD keyword naturally placed.`

const buildUserPrompt = (resumeText, jobDescription, userInstructions = '', resumeLength = 'auto') => {
  const lengthRule = {
    'auto': '',
    '1page': 'STRICT: Output must fit on 1 page. Keep only last 2 roles. Cut older experience.',
    '2page': 'Output can span 2 pages. Include all experience.',
    'academic': 'Academic CV format. Include all publications, research, teaching experience.',
  }[resumeLength] || ''

  return `## ORIGINAL RESUME TO OPTIMIZE:
${resumeText}

## TARGET JOB DESCRIPTION:
${jobDescription}

${userInstructions ? `## SPECIAL USER INSTRUCTIONS (must follow):
${userInstructions}` : ''}

${lengthRule}

## YOUR TASK:
Follow all 6 steps of the optimization process.
Extract JD keywords first.
Score original honestly.
Rewrite EVERY bullet using STAR-K formula.
Add JD keywords to skills section exactly.
Score rewritten resume.

Return ONLY this JSON — no markdown, no backticks, no explanation, pure valid JSON:
{
  "atsBefore": <honest score 28-55>,
  "atsAfter": <optimized score 75-92>,
  "scoreDimensions": {
    "keywordMatch": <0-100>,
    "formatScore": <0-100>,
    "actionVerbScore": <0-100>,
    "quantifiedBullets": <0-100>,
    "sectionCompleteness": <0-100>
  },
  "scoreLabel": "Good" or "Excellent",
  "industryDetected": "tech|finance|healthcare|marketing|sales|general",
  "keywordsAnalysis": {
    "totalInJD": <number>,
    "foundInOriginal": <number>,
    "foundInRewritten": <number>
  },
  "missingKeywords": ["exact JD keyword 1", "exact JD keyword 2", "...up to 8"],
  "addedKeywords": ["keyword injected 1", "keyword injected 2", "...up to 8"],
  "weakVerbsReplaced": [
    {"original": "worked on", "replacement": "Architected"},
    {"original": "helped with", "replacement": "Optimized"}
  ],
  "bulletsRewritten": <total count of bullets rewritten>,
  "metricsAdded": <count of NEW metrics you added>,
  "recruiterTips": [
    "Specific tip 1 for this exact resume",
    "Specific tip 2 for this exact resume",
    "Specific tip 3 for this exact resume"
  ],
  "rewrittenResume": "FULL NAME\\nemail | phone | city\\n\\nPROFESSIONAL SUMMARY\\n[summary text]\\n\\nWORK EXPERIENCE\\n\\n[Job Title] — [Company] | [Date]\\n[City]\\n• [bullet]\\n• [bullet]\\n\\nSKILLS\\n[Category]: [skills]\\n\\nEDUCATION\\n[Degree] — [Institution] | [Year]",
  "coverLetterPoints": [
    "Key achievement to highlight in cover letter",
    "Key skill match to emphasize",
    "Specific value proposition for this role"
  ]
}`
}

// ─── HEALTH CHECK ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'SureCv API' })
})

// ─── MAIN OPTIMIZE ENDPOINT ───────────────────────────
app.post('/api/optimize', async (req, res) => {
  try {
    const { 
      resumeText, 
      jobDescription, 
      userInstructions = '',
      resumeLength = 'auto'
    } = req.body

    if (!resumeText || !jobDescription) {
      return res.status(400).json({ 
        error: 'Resume and job description required' 
      })
    }

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    if (!NVIDIA_KEY) {
      return res.status(500).json({ 
        error: 'API not configured' 
      })
    }

    const userPrompt = buildUserPrompt(resumeText, jobDescription, userInstructions, resumeLength)

    console.log('[SureCv API] Calling NVIDIA NIM with Premium Optimization...')

    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NVIDIA_KEY}`,
        },
        body: JSON.stringify({
          model: 'meta/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: PREMIUM_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.2,
          top_p: 0.8,
          max_tokens: 4096,
          stream: false,
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[NVIDIA Error]', response.status, errText)
      return res.status(502).json({ 
        error: `AI service error: ${response.status}` 
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return res.status(502).json({ error: 'Empty AI response' })
    }

    // Clean and extract JSON
    const clean = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const jsonStart = clean.indexOf('{')
    const jsonEnd = clean.lastIndexOf('}')

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error('[Parse Error] No JSON in response:', clean.substring(0, 200))
      return res.status(502).json({ error: 'Invalid AI response format' })
    }

    const jsonStr = clean.substring(jsonStart, jsonEnd + 1)
    const result = JSON.parse(jsonStr)

    // Clean up the rewrittenResume text
    if (result.rewrittenResume) {
      result.rewrittenResume = result.rewrittenResume
        .replace(/\\n/g, '\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }

    console.log(`[SureCv API] ✅ Premium Optimization Complete! ATS Score: ${result.atsBefore} → ${result.atsAfter}`)

    res.json(result)

  } catch (error) {
    console.error('[SureCv API Error]', error)
    res.status(500).json({ 
      error: 'Optimization failed. Please try again.' 
    })
  }
})

// ─── COVER LETTER ENDPOINT ────────────────────────────
app.post('/api/cover-letter', async (req, res) => {
  try {
    const { 
      resumeText, 
      jobDescription, 
      jobTitle = '',
      companyName = '',
      tone = 'professional'
    } = req.body

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY

    if (!NVIDIA_KEY) {
      return res.status(500).json({ 
        error: 'API not configured' 
      })
    }

    const systemPrompt = `You are SureCv's Premium Cover Letter Writer — trained on the same methodology used by Kickresume and Enhancv.

## HOW PREMIUM COVER LETTERS WORK (Kickresume/Enhancv method):

STRUCTURE — 4 paragraphs only:

PARAGRAPH 1 — THE HOOK (3-4 sentences):
- Start with a STRONG opening — NOT "I am writing to..."
- Reference something specific about the company/role
- State your exact job title match
- Drop your biggest career achievement immediately
- End with enthusiasm for THIS specific role

PARAGRAPH 2 — PROOF OF VALUE (4-5 sentences):
- Pick TOP 2-3 achievements from resume
- Each achievement must have a metric (%, ₹, #)
- Connect each achievement to a JD requirement
- Use EXACT keywords from job description
- Show you solve THEIR specific problem

PARAGRAPH 3 — COMPANY FIT (3-4 sentences):
- Show you researched the company/role
- Connect YOUR values to company's mission
- Mention specific JD requirement you excel at
- Use industry-specific language from JD

PARAGRAPH 4 — CALL TO ACTION (2-3 sentences):
- Express genuine excitement
- Request specific next step (interview/call)
- Professional closing that matches resume tone

## CRITICAL RULES:
1. NEVER start with "I am writing to express my interest"
2. NEVER use these clichés:
   - "hardworking", "team player", "detail-oriented"
   - "passionate about", "results-driven" (overused)
   - "I believe I would be a great fit"
   - "Please find attached my resume"
3. ALWAYS include at least 2 specific metrics from resume
4. ALWAYS use exact job title from JD in paragraph 1
5. ALWAYS match keywords from JD naturally
6. KEEP under 350 words — hiring managers read fast
7. SOUND human — not AI-generated
8. Match the tone: ${tone}

## OPENING HOOKS BY INDUSTRY (use as reference):
SALES: "Closing ₹3.2Cr in Q3 while managing 12 territories taught me one thing: [insight about role]"
TECH: "When I architected [specific project], I learned exactly what [company] is trying to solve with [role]"
FINANCE: "Managing ₹50Cr+ portfolio through [challenge] gave me a unique perspective on [JD requirement]"
HEALTHCARE: "After coordinating care for 200+ patients per week, I know that [insight about role]"
GENERAL: "[Specific achievement] — this is the kind of impact I want to bring to [company] as [role]"

Return ONLY this JSON:
{
  "coverLetter": "<full cover letter text with real newlines between paragraphs>",
  "wordCount": <number>,
  "keywordsUsed": ["keyword1", "keyword2"],
  "toneUsed": "${tone}",
  "openingType": "achievement-hook"
}`

    const userPrompt = `Write a premium cover letter for:

JOB TITLE: ${jobTitle || 'the position'}
COMPANY: ${companyName || 'the company'}

CANDIDATE RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Follow the 4-paragraph structure exactly.
Use candidate's REAL achievements with metrics.
Match JD keywords naturally.
Keep under 350 words.
Return ONLY valid JSON.`

    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${NVIDIA_KEY}`,
        },
        body: JSON.stringify({
          model: 'meta/llama-3.3-70b-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.6,
          max_tokens: 1500,
          stream: false,
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[NVIDIA Cover Letter Error]', response.status, errText)
      return res.status(502).json({ 
        error: `AI service error: ${response.status}` 
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''
    
    const clean = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const jsonStart = clean.indexOf('{')
    const jsonEnd = clean.lastIndexOf('}')
    
    if (jsonStart === -1 || jsonEnd === -1) {
      return res.status(502).json({ error: 'Invalid AI response format' })
    }

    const jsonStr = clean.substring(jsonStart, jsonEnd + 1)
    const result = JSON.parse(jsonStr)

    // Clean the cover letter text
    if (result.coverLetter) {
      result.coverLetter = result.coverLetter
        .replace(/\\n/g, '\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }

    console.log(`[SureCv API] ✅ Premium cover letter generated for ${jobTitle}!`)

    res.json(result)

  } catch (error) {
    console.error('[Cover Letter Error]', error)
    res.status(500).json({ error: 'Cover letter generation failed' })
  }
})

app.listen(PORT, () => {
  console.log(`✅ SureCv API running on port ${PORT}`)
})
