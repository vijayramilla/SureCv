import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .map((line) => {
      const i = line.indexOf('=')
      return [line.slice(0, i).trim(), line.slice(i + 1).trim()]
    })
)

const groqKeys = [
  env.VITE_GROQ_API_KEY,
  env.VITE_GROQ_API_KEY_SECONDARY,
].filter(Boolean)
const geminiKey = env.VITE_GEMINI_API_KEY
const geminiModel = env.VITE_GEMINI_MODEL || 'gemini-2.0-flash'

async function testGroqKey(key, label) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 16,
      messages: [{ role: 'user', content: 'Reply with OK only' }],
    }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Groq ${label} ${res.status}: ${body.slice(0, 200)}`)
  console.log(`Groq ${label}: OK`)
}

async function testGemini() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Reply with OK only' }] }],
    }),
  })
  const body = await res.text()
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${body.slice(0, 200)}`)
  console.log('Gemini: OK')
}

if (groqKeys.length === 0) console.error('Missing VITE_GROQ_API_KEY')
if (!geminiKey) console.error('Missing VITE_GEMINI_API_KEY')

for (let i = 0; i < groqKeys.length; i++) {
  const label = i === 0 ? 'primary' : 'secondary'
  try {
    await testGroqKey(groqKeys[i], label)
  } catch (e) {
    console.error(String(e))
  }
}

try {
  await testGemini()
} catch (e) {
  console.error(String(e))
}
