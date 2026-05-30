import { getApiBase } from '../lib/apiBase'

const API_BASE = getApiBase()

export async function optimizeResume(
  resumeText,
  jobDescription,
  userInstructions = '',
  resumeLength = 'auto'
) {
  const res = await fetch(`${API_BASE}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText, jobDescription,
      userInstructions, resumeLength
    })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Optimization failed')
  }
  return res.json()
}

export async function generateCoverLetter(
  resumeText,
  jobDescription,
  jobTitle = '',
  companyName = '',
  tone = 'professional'
) {
  const res = await fetch(`${API_BASE}/api/cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText, jobDescription,
      jobTitle, companyName, tone
    })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Cover letter failed')
  }
  return res.json()
}

export async function parseResumePDF(file) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch(`${API_BASE}/api/parse-resume`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Parse failed')
  }
  return res.json()
}
