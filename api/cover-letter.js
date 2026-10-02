/**
 * SureCv — POST /api/cover-letter (Vercel serverless function)
 * Ported from server/index.js (Express) for Vercel deployment.
 */
import {
  json,
  handleOptions,
  applyCors,
  readJsonBody,
  callNvidia,
} from './_lib/ai.js'

export default async function handler(req, res) {
  applyCors(req, res)

  if (req.method === 'OPTIONS') {
    if (!handleOptions(req, res)) json(res, 403, { error: 'CORS blocked' })
    return
  }
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' })
  }

  try {
    const { resumeText, jobDescription, jobTitle, companyName } = readJsonBody(req)

    const content = await callNvidia(
      [
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
      { temperature: 0.5, maxTokens: 800 }
    )

    return json(res, 200, { coverLetter: content || '' })
  } catch (error) {
    console.error('[Cover Letter Error]', error)
    return json(res, error?.status || 500, { error: 'Cover letter generation failed' })
  }
}
