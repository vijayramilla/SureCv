/** One-off smoke test for the Vercel function helpers + handlers.
 *  Run: node --env-file=.env scripts/smoke-vercel-functions.mjs
 */
import { callNvidia, parseJsonFromContent, cleanRewrittenResume } from '../api/_lib/ai.js'
import optimizeHandler from '../api/optimize.js'
import coverLetterHandler from '../api/cover-letter.js'

// ── 1. Text cleanup (literal \n sequences + markdown) ────────────────────────
const literalNl = 'hello\\n\\nworld **bold** *italic*'
console.log('cleanRewrittenResume →', JSON.stringify(cleanRewrittenResume(literalNl)))

// ── 2. Lib-level NVIDIA call ─────────────────────────────────────────────────
const content = await callNvidia(
  [{ role: 'user', content: 'Reply ONLY with this JSON: {"ok":true}' }],
  { temperature: 0, maxTokens: 16 }
)
console.log('callNvidia raw →', JSON.stringify(content))
console.log('parseJsonFromContent →', JSON.stringify(parseJsonFromContent(content)))

// ── 3. Handler-level tests with mocked req/res ───────────────────────────────
function mockRes() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(k, v) {
      this.headers[k] = v
    },
    end(chunk) {
      if (chunk) this.body += chunk
    },
  }
}

const req = (method, body) => ({ method, headers: {}, body })

console.log('\n[optimize] POST valid body (real NVIDIA call, may take ~15-30s)...')
const t0 = Date.now()
let res = mockRes()
await optimizeHandler(
  req('POST', {
    resumeText:
      'John Doe — john@mail.com | Bangalore\nWORK EXPERIENCE\n- worked on backend apis at TCS using nodejs\n- helped team fix bugs and improve website speed\nSKILLS: java, sql',
    jobDescription:
      'Backend Developer — Node.js, REST APIs, AWS, Docker, SQL. Build scalable services, improve latency.',
  }),
  res
)
console.log(`[optimize] status=${res.statusCode} (${((Date.now() - t0) / 1000).toFixed(1)}s)`)
const parsed = JSON.parse(res.body)
console.log(
  `[optimize] ats ${parsed.atsBefore} → ${parsed.atsAfter}, keys: ${Object.keys(parsed).join(',')}`
)

console.log('\n[cover-letter] POST valid body...')
res = mockRes()
await coverLetterHandler(
  req('POST', {
    resumeText: 'John Doe, backend dev, nodejs',
    jobDescription: 'Node.js backend developer',
    jobTitle: 'Backend Developer',
    companyName: 'Acme',
  }),
  res
)
console.log(`[cover-letter] status=${res.statusCode}`)
console.log('[cover-letter] preview:', JSON.parse(res.body).coverLetter.slice(0, 120))

console.log('\n[optimize] OPTIONS preflight...')
res = mockRes()
await optimizeHandler(
  { method: 'OPTIONS', headers: { origin: 'https://surecv.in' } },
  res
)
console.log(`[optimize] OPTIONS status=${res.statusCode} cors=${res.headers['Access-Control-Allow-Origin']}`)

console.log('\n[optimize] 400 on missing fields...')
res = mockRes()
await optimizeHandler(req('POST', {}), res)
console.log(`[optimize] status=${res.statusCode} body=${res.body}`)

console.log('\n✅ all smoke tests passed')
