/**
 * Shared helpers for the SureCv Vercel serverless functions.
 * Ported from server/index.js so the same routes run on Vercel.
 */

const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions'
// meta/llama-3.3-70b-instruct reached EOL (410 Gone) on 2026-08-26.
// llama-3.2-11b-vision is fast, non-reasoning, and returns clean JSON.
// Override with the NVIDIA_MODEL env var if needed.
const NVIDIA_MODEL = process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct'

const ALLOWED_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'https://surecv.in',
  'https://www.surecv.in',
  'http://surecv.in',
  'http://www.surecv.in',
])

function corsHeaders(req) {
  const origin = req.headers?.origin
  // Allow preview deployments (*.vercel.app) for testing
  if (origin && (ALLOWED_ORIGINS.has(origin) || origin.endsWith('.vercel.app'))) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  }
  return {}
}

function json(res, status, body) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

/** Handle OPTIONS preflight; returns false if the origin is not allowed. */
function handleOptions(req, res) {
  const headers = corsHeaders(req)
  if (!headers['Access-Control-Allow-Origin']) return false
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v)
  res.statusCode = 204
  res.end()
  return true
}

/** Apply CORS headers to a non-OPTIONS response (no-op for disallowed origins). */
function applyCors(req, res) {
  for (const [k, v] of Object.entries(corsHeaders(req))) res.setHeader(k, v)
}

function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  if (typeof req.body === 'string' && req.body.trim()) {
    try {
      return JSON.parse(req.body)
    } catch {
      return {}
    }
  }
  return {}
}

async function callNvidia(messages, { temperature = 0.3, maxTokens = 4096 } = {}) {
  const NVIDIA_KEY = process.env.NVIDIA_API_KEY
  if (!NVIDIA_KEY) {
    throw Object.assign(new Error('API not configured'), { status: 500 })
  }

  const response = await fetch(NVIDIA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NVIDIA_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    console.error('[NVIDIA Error]', response.status, errText)
    throw Object.assign(new Error(`AI service error: ${response.status}`), { status: 502 })
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content
}

/**
 * Repair common model JSON mistakes before parsing:
 * - raw newlines/tabs inside string literals (models pretty-print strings)
 * - missing trailing commas are left to the model; we only fix control chars
 */
function sanitizeRawJsonControlChars(raw) {
  let out = ''
  let inString = false
  let escaped = false
  for (const ch of raw) {
    if (inString) {
      if (escaped) {
        escaped = false
        out += ch
        continue
      }
      if (ch === '\\') {
        escaped = true
        out += ch
        continue
      }
      if (ch === '"') {
        inString = false
        out += ch
        continue
      }
      if (ch === '\n') {
        out += '\\n'
        continue
      }
      if (ch === '\r') {
        out += '\\r'
        continue
      }
      if (ch === '\t') {
        out += '\\t'
        continue
      }
      out += ch
      continue
    }
    if (ch === '"') inString = true
    out += ch
  }
  return out
}

/** Extract a JSON object from a raw model response (strips ``` fences). */
function parseJsonFromContent(content) {
  const clean = String(content)
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim()

  const jsonStart = clean.indexOf('{')
  const jsonEnd = clean.lastIndexOf('}')
  if (jsonStart === -1 || jsonEnd === -1) {
    console.error('[Parse Error] No JSON in response:', clean.substring(0, 200))
    throw Object.assign(new Error('Invalid AI response format'), { status: 502 })
  }
  const jsonStr = sanitizeRawJsonControlChars(clean.substring(jsonStart, jsonEnd + 1))
  return JSON.parse(jsonStr)
}

/** Clean up the rewritten resume text (same rules as the Express server). */
function cleanRewrittenResume(text) {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export {
  json,
  handleOptions,
  applyCors,
  readJsonBody,
  callNvidia,
  parseJsonFromContent,
  cleanRewrittenResume,
}
