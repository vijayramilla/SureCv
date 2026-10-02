import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const distPath = path.resolve(__dirname, '..', 'dist')
const hasFrontendBuild = fs.existsSync(path.join(distPath, 'index.html'))

const app = express()
const PORT = process.env.PORT || 3001
const HOST = process.env.HOST || '0.0.0.0'

function getAllowedOrigins() {
  const origins = new Set([
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'https://surecv.in',
    'https://www.surecv.in',
    'http://surecv.in',
    'http://www.surecv.in',
  ])

  const frontend = process.env.FRONTEND_URL?.trim()
  if (frontend) origins.add(frontend.replace(/\/$/, ''))

  const railwayHost = process.env.RAILWAY_PUBLIC_DOMAIN?.trim()
  if (railwayHost) {
    origins.add(`https://${railwayHost}`)
  }

  const extra = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean)
  if (extra) extra.forEach((o) => origins.add(o.replace(/\/$/, '')))

  return [...origins]
}

const allowedOrigins = getAllowedOrigins()

app.disable('x-powered-by')

app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  next()
})

app.use((req, res, next) => {
  if (/\.(env|pem|key|crt)$/i.test(req.path) || req.path.includes('/.env')) {
    return res.status(404).end()
  }
  next()
})

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    console.warn('[CORS] Blocked origin:', origin)
    callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// ─── HEALTH CHECK ─────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SureCv API',
    nvidia: process.env.NVIDIA_API_KEY ? 'connected' : 'missing',
    origins: allowedOrigins.length,
  })
})

// ─── MAIN OPTIMIZE ENDPOINT ───────────────────────────
app.post('/api/optimize', async (req, res) => {
  try {
    const {
      resumeText,
      jobDescription,
      userInstructions = '',
      resumeLength = 'auto',
    } = req.body

    if (!resumeText || !jobDescription) {
      return res.status(400).json({
        error: 'Resume and job description required',
      })
    }

    const NVIDIA_KEY = process.env.NVIDIA_API_KEY
    if (!NVIDIA_KEY) {
      return res.status(500).json({
        error: 'API not configured',
      })
    }

    const lengthRule = {
      auto: 'Decide page count based on experience.',
      '1page': 'STRICT 1 PAGE — cut to most recent 2 roles only.',
      '2page': 'Up to 2 pages — keep all relevant experience.',
      academic: 'Full academic CV format.',
    }[resumeLength] || ''

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

EXACT rewrittenResume FORMAT:
[Full Name]\\n
[email] | [phone] | [city]\\n
\\n
PROFESSIONAL SUMMARY\\n
[2-3 sentences with JD keywords + achievement metric]\\n
\\n
WORK EXPERIENCE\\n
\\n
[Job Title] — [Company] | [Date]\\n
[City]\\n
- [PowerVerb specific achievement metric]\\n
- [PowerVerb specific achievement metric]\\n
- [PowerVerb specific achievement metric]\\n
\\n
SKILLS\\n
[Category]: [skill1], [skill2], [skill3]\\n
\\n
EDUCATION\\n
[Degree] — [Institution] | [Year]\\n

Return ONLY valid JSON:
{
  "atsBefore": <30-55>,
  "atsAfter": <75-95>,
  "scoreDimensions": {
    "keywordMatch": <0-100>,
    "formatScore": <0-100>,
    "actionVerbScore": <0-100>,
    "quantifiedBullets": <0-100>,
    "sectionCompleteness": <0-100>
  },
  "scoreLabel": "Good" or "Excellent",
  "industryDetected": "tech|finance|healthcare|marketing|sales|general",
  "missingKeywords": ["keyword1","keyword2","keyword3","keyword4","keyword5"],
  "addedKeywords": ["keyword1","keyword2","keyword3","keyword4","keyword5"],
  "weakVerbsReplaced": [
    {"original":"worked on","replacement":"Engineered"}
  ],
  "bulletsRewritten": <number>,
  "metricsAdded": <number>,
  "recruiterTips": ["tip1","tip2","tip3"],
  "rewrittenResume": "<full resume with real newlines>",
  "coverLetterPoints": ["point1","point2","point3"]
}`

    const userPrompt = `RESUME:\n${resumeText}\n\n
JOB DESCRIPTION:\n${jobDescription}\n\n
${userInstructions ? `USER INSTRUCTIONS:\n${userInstructions}\n\n` : ''}
${lengthRule}

Completely rewrite this resume. 
Return ONLY valid JSON. No markdown. No backticks.`

    console.log('[SureCv API] Calling NVIDIA NIM...')

    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NVIDIA_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          top_p: 0.9,
          max_tokens: 4096,
          stream: false,
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[NVIDIA Error]', response.status, errText)
      return res.status(502).json({
        error: `AI service error: ${response.status}`,
      })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return res.status(502).json({ error: 'Empty AI response' })
    }

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

    if (result.rewrittenResume) {
      result.rewrittenResume = result.rewrittenResume
        .replace(/\\n/g, '\n')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    }

    console.log(
      '[SureCv API] Success! ATS:',
      result.atsBefore,
      '→',
      result.atsAfter
    )

    res.json(result)
  } catch (error) {
    console.error('[SureCv API Error]', error)
    res.status(500).json({
      error: 'Optimization failed. Please try again.',
    })
  }
})

// ─── COVER LETTER ENDPOINT ────────────────────────────
app.post('/api/cover-letter', async (req, res) => {
  try {
    const { resumeText, jobDescription, jobTitle, companyName } = req.body
    const NVIDIA_KEY = process.env.NVIDIA_API_KEY

    if (!NVIDIA_KEY) {
      return res.status(500).json({ error: 'API not configured' })
    }

    const response = await fetch(
      'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${NVIDIA_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || 'meta/llama-3.2-11b-vision-instruct',
          messages: [
            {
              role: 'system',
              content: `Write a professional cover letter.
3-4 paragraphs. Opening hook + achievement + skills match + CTA.
No clichés. Return ONLY the cover letter body text.
No subject line, no date, no address.`,
            },
            {
              role: 'user',
              content: `Job: ${jobTitle} at ${companyName}
Resume: ${resumeText}
JD: ${jobDescription}`,
            },
          ],
          temperature: 0.5,
          max_tokens: 800,
          stream: false,
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('[NVIDIA Cover Letter Error]', response.status, errText)
      return res.status(502).json({ error: `AI service error: ${response.status}` })
    }

    const data = await response.json()
    const coverLetter = data.choices?.[0]?.message?.content || ''
    res.json({ coverLetter })
  } catch (error) {
    console.error('[Cover Letter Error]', error)
    res.status(500).json({ error: 'Cover letter generation failed' })
  }
})

// ─── SERVE FRONTEND (production full-stack on Railway) ─
if (hasFrontendBuild && process.env.SERVE_STATIC !== 'false') {
  console.log('[SureCv] Serving frontend from', distPath)
  app.use(
    express.static(distPath, {
      maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0,
      index: false,
    })
  )
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next()
    }
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
} else if (process.env.NODE_ENV === 'production') {
  app.get('/', (_req, res) => {
    res.status(503).json({
      error: 'Frontend not built',
      hint: 'Set Railway root to repo root and buildCommand: npm install && npm run build',
    })
  })
}

let httpServer = null

function startServer(port) {
  const server = app.listen(port, HOST, () => {
    httpServer = server
    console.log(`✅ SureCv API running on ${HOST}:${port}`)
    console.log(`🔑 NVIDIA: ${process.env.NVIDIA_API_KEY ? 'Connected ✓' : 'MISSING KEY ✗'}`)
    console.log(`📦 Frontend: ${hasFrontendBuild ? 'serving /dist' : 'API only (no dist/)'}`)
    console.log(`🌐 CORS origins: ${allowedOrigins.join(', ')}`)
    if (process.env.RAILWAY_PUBLIC_DOMAIN) {
      console.log(`🚂 Railway: https://${process.env.RAILWAY_PUBLIC_DOMAIN}/health`)
    }
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = port + 1
      console.warn(`⚠️ Port ${port} busy, trying ${nextPort}...`)
      server.close(() => startServer(nextPort))
      return
    }
    console.error('[Server Error]', err)
    process.exit(1)
  })
}

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...')
  httpServer?.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...')
  httpServer?.close(() => process.exit(0))
})

startServer(Number(PORT))
