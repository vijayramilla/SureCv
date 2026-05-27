/**
 * SureCV API server — Puppeteer (PDF, PNG, URLs) + Gemini ATS + pdf-parse
 * Run: npm run server  (port 8787)  |  npm run dev:full
 */
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import puppeteer from 'puppeteer'
import pdfParse from 'pdf-parse'
import { loadEnvFile } from './loadEnv.mjs'
import { buildResumeHtml } from './resumePdfTemplate.mjs'
import { calculateAtsScoreWithGemini } from './atsScore.mjs'

loadEnvFile()

const PORT = Number(process.env.SCRAPER_PORT || 8787)
const app = express()

app.use(cors({ origin: true }))
app.use(express.json({ limit: '2mb' }))

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
})

let browserPromise = null

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
  }
  return browserPromise
}

async function renderResumePage(resumeData, theme) {
  const browser = await getBrowser()
  const page = await browser.newPage()
  const html = buildResumeHtml(resumeData, theme)
  await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 })
  return page
}

function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function countWords(text) {
  return text.split(/\s+/).filter(Boolean).length
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'surecv-api' })
})

app.post('/api/generate-resume-pdf', async (req, res) => {
  let page = null
  try {
    const { resumeData, theme = 'dark' } = req.body || {}
    if (!resumeData?.name) {
      return res.status(400).json({ error: 'resumeData is required' })
    }

    page = await renderResumePage(resumeData, theme)
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    const filename = `${String(resumeData.name).replace(/[^\w.-]/g, '_') || 'Resume'}_Resume.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(Buffer.from(pdf))
  } catch (err) {
    console.error('[generate-resume-pdf]', err)
    res.status(500).json({ error: 'PDF generation failed' })
  } finally {
    if (page) await page.close().catch(() => {})
  }
})

app.post('/api/preview-resume-png', async (req, res) => {
  let page = null
  try {
    const { resumeData, theme = 'dark' } = req.body || {}
    if (!resumeData?.name) {
      return res.status(400).json({ error: 'resumeData is required' })
    }

    page = await renderResumePage(resumeData, theme)
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 })

    const png = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width: 794, height: 500 },
    })

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'no-store')
    res.send(Buffer.from(png))
  } catch (err) {
    console.error('[preview-resume-png]', err)
    res.status(500).json({ error: 'Preview generation failed' })
  } finally {
    if (page) await page.close().catch(() => {})
  }
})

app.post('/api/calculate-ats-score', async (req, res) => {
  try {
    const resumeText = typeof req.body?.resumeText === 'string' ? req.body.resumeText.trim() : ''
    const jobDescription =
      typeof req.body?.jobDescription === 'string' ? req.body.jobDescription.trim() : ''
    const optimizedResumeText =
      typeof req.body?.optimizedResumeText === 'string'
        ? req.body.optimizedResumeText.trim()
        : undefined

    if (resumeText.length < 30 || jobDescription.length < 20) {
      return res.status(400).json({ error: 'Resume and job description too short' })
    }

    const data = await calculateAtsScoreWithGemini(
      resumeText,
      jobDescription,
      optimizedResumeText || undefined
    )
    res.json(data)
  } catch (err) {
    console.error('[calculate-ats-score]', err)
    res.status(500).json({ error: 'ATS scoring unavailable' })
  }
})

app.post('/api/extract-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ error: 'No PDF file uploaded' })
    }

    const parsed = await pdfParse(req.file.buffer)
    const text = cleanText(parsed.text || '')

    if (text.length < 20) {
      return res.status(422).json({
        error:
          'Could not extract enough text. This may be a scanned PDF — paste text manually.',
      })
    }

    res.json({
      text,
      pageCount: parsed.numpages || 1,
      wordCount: countWords(text),
      success: true,
    })
  } catch (err) {
    console.error('[extract-pdf]', err)
    res.status(500).json({ error: 'PDF extraction failed' })
  }
})

app.post('/api/optimize-resume', async (req, res) => {
  try {
    const resume = typeof req.body?.resume === 'string' ? req.body.resume.trim() : ''
    const jobDescription =
      typeof req.body?.jobDescription === 'string' ? req.body.jobDescription.trim() : ''

    if (resume.length < 30) {
      return res.status(400).json({
        error: 'Resume too short (minimum 30 words). Add your experience, education and skills.',
      })
    }

    if (jobDescription.length < 20) {
      return res.status(400).json({
        error:
          'Job description too short (minimum 20 words). Paste the complete job posting.',
      })
    }

    // Call NVIDIA API
    const nvidiaApiKey = process.env.NVIDIA_API_KEY || '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'
    const nvidiaResponse = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${nvidiaApiKey}`,
      },
      body: JSON.stringify({
        model: 'meta/llama-3.3-70b-instruct',
        messages: [
          {
            role: 'system',
            content: `You are SureCV's world-class ATS Resume Optimization Engine.

CORE RULES:
1. EXACT KEYWORD MATCH — use word-for-word from JD
2. SINGLE COLUMN OUTPUT ONLY — no tables
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

MANDATORY REWRITING RULES:
1. REWRITE EVERY bullet point — no exceptions
2. EVERY bullet starts with a power verb
3. EVERY bullet includes a metric (%, ₹, #, time)
4. Optimized score must be 20+ points higher than original
5. bulletsImproved = total bullets rewritten

Return ONLY this JSON (no markdown):
{
  "atsScore": <0-100>,
  "scoreDimensions": {"keywordMatch": <0-100>, "formatScore": <0-100>, "actionVerbScore": <0-100>, "quantifiedBullets": <0-100>, "sectionCompleteness": <0-100>},
  "scoreLabel": <"Poor"|"Fair"|"Good"|"Excellent">,
  "missingKeywords": [<max 10>],
  "addedKeywords": [<max 10>],
  "weakVerbsFound": [{"original": "X", "replacement": "Y"}],
  "bulletsImproved": <number>,
  "metricsAdded": <number>,
  "industryDetected": <"tech"|"finance"|"healthcare"|"marketing"|"general">,
  "recruiterTips": [<3-5 tips>],
  "rewrittenResume": "<complete optimized resume>",
  "coverLetterPoints": [<3 points>],
  "candidate_name": "<name>",
  "target_role": "<role>",
  "target_company": "<company>",
  "original_score": <0-100>,
  "optimized_score": <0-100>,
  "score_lift": <number>,
  "scoreData": {"before": <0-100>, "after": <0-100>, "keywords_added": <number>, "bullets_rewritten": <number>, "skills_match_pct": <0-100>, "keywords_added_list": [], "keywords_missing_list": [], "verbs_replaced": [], "analysis_message": "<message>", "rubric_message": "<message>", "tips": []}
}`,
          },
          {
            role: 'user',
            content: `Optimize this resume against the job description:

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Return ONLY the JSON response.`,
          },
        ],
        temperature: 0.2,
        top_p: 0.7,
        max_tokens: 4096,
        stream: false,
      }),
      timeout: 60000,
    })

    if (!nvidiaResponse.ok) {
      const error = await nvidiaResponse.json().catch(() => ({}))
      console.error('[NVIDIA API Error]', error)
      throw new Error(
        error?.error?.message ||
          `NVIDIA API error: ${nvidiaResponse.status}`
      )
    }

    const data = await nvidiaResponse.json()

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Empty response from NVIDIA API')
    }

    const content = data.choices[0].message.content
    
    // Parse JSON response
    let jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      // Try to extract from markdown code block
      const mdMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
      if (mdMatch) {
        jsonMatch = [mdMatch[1]]
      }
    }

    if (!jsonMatch) {
      throw new Error('Could not parse NVIDIA response as JSON')
    }

    const result = JSON.parse(jsonMatch[0])
    
    res.json({
      success: true,
      data: result,
    })
  } catch (err) {
    console.error('[optimize-resume]', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Resume optimization failed',
    })
  }
})

app.post('/api/fetch-url', async (req, res) => {
  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : ''
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return res.status(400).json({ error: 'Invalid URL' })
  }

  let page = null
  try {
    const browser = await getBrowser()
    page = await browser.newPage()
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    await page.setViewport({ width: 1280, height: 900 })

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    })

    await new Promise((r) => setTimeout(r, 2000))

    const raw = await page.evaluate(() => {
      const clone = document.body.cloneNode(true)
      clone
        .querySelectorAll(
          'script, style, noscript, nav, footer, header, iframe, svg, [aria-hidden="true"]'
        )
        .forEach((el) => el.remove())
      return clone.innerText || document.body?.innerText || ''
    })

    const text = cleanText(raw).slice(0, 8000)
    if (text.length < 40) {
      return res.status(422).json({
        error: 'Page returned too little text. Paste the job description manually.',
      })
    }

    res.json({ text, wordCount: countWords(text), success: true })
  } catch (err) {
    console.error('[fetch-url]', url, err)
    res.status(500).json({ error: 'Could not fetch URL with browser engine' })
  } finally {
    if (page) await page.close().catch(() => {})
  }
})

process.on('SIGINT', async () => {
  if (browserPromise) {
    const b = await browserPromise
    await b.close().catch(() => {})
  }
  process.exit(0)
})

app.listen(PORT, () => {
  console.log(`SureCV API → http://localhost:${PORT}`)
})
