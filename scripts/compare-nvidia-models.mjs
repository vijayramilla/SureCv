/** One-off: compare finalist models on a realistic resume rewrite. */
import { readFileSync } from 'node:fs'
import { parseJsonFromContent, cleanRewrittenResume } from '../api/_lib/ai.js'

const KEY = process.env.NVIDIA_API_KEY
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

Return ONLY valid JSON with keys:
{"atsBefore":<30-55>,"atsAfter":<75-95>,"rewrittenResume":"<full resume text>","missingKeywords":["k1","k2"],"recruiterTips":["t1","t2"]}`

const userPrompt = `RESUME:\\nJohn Doe — john@mail.com | Bangalore
2 years experience
WORK EXPERIENCE
- worked on backend apis at TCS using nodejs
- helped team fix bugs and improve website speed
- made reports in excel for sales team
SKILLS: java, sql, excel
EDUCATION: B.Tech CBE 2022

JOB DESCRIPTION:\\nBackend Developer — Node.js, REST APIs, AWS, Docker, SQL, CI/CD. 2+ years experience. Build scalable services, improve latency, own deployments.

Completely rewrite this resume. Return ONLY valid JSON. No markdown. No backticks.`

const models = process.argv[2]
  ? [process.argv[2]]
  : ['meta/llama-3.2-11b-vision-instruct', 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning']

for (const model of models) {
  const started = Date.now()
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
        stream: false,
      }),
    })
    const ms = Date.now() - started
    if (!res.ok) {
      console.log(`✗ ${model} → HTTP ${res.status}`)
      continue
    }
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content || ''
    const usage = data.usage || {}
    let ok = false
    let head = ''
    try {
      const parsed = parseJsonFromContent(content)
      ok = Boolean(parsed.rewrittenResume)
      head = cleanRewrittenResume(parsed.rewrittenResume).split('\n').slice(0, 3).join(' | ')
    } catch (e) {
      head = `PARSE FAIL: ${e.message}`
    }
    console.log(
      `${ok ? '✓' : '✗'} ${model} (${(ms / 1000).toFixed(1)}s, tokens=${usage.completion_tokens}) ${head}`
    )
  } catch (err) {
    console.log(`✗ ${model} → ${err.message}`)
  }
}
