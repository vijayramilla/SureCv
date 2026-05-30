import { getApiBase } from '../lib/apiBase'

const API_BASE = getApiBase()

export async function analyzeResume(
  resumeText,
  jobDescription,
  userInstructions = '',
  resumeLength = 'auto'
) {
  const response = await fetch(`${API_BASE}/api/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText,
      jobDescription,
      userInstructions,
      resumeLength,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Optimization failed')
  }

  return response.json()
}

export async function generateCoverLetter(
  resumeText,
  jobDescription,
  jobTitle = '',
  companyName = ''
) {
  const response = await fetch(`${API_BASE}/api/cover-letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      resumeText,
      jobDescription,
      jobTitle,
      companyName,
    }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error || 'Cover letter failed')
  }

  const data = await response.json()
  return data.coverLetter || ''
}
