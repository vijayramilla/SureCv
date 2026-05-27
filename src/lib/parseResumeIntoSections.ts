/** Structured resume for premium PDF rendering. */

export interface PdfExperience {
  title: string
  company: string
  date: string
  location: string
  bullets: string[]
}

export interface PdfSkillGroup {
  category: string
  items: string[]
}

export interface PdfEducation {
  degree: string
  institution: string
  year: string
  grade: string
}

export interface PdfCertification {
  name: string
  issuer: string
  year: string
}

export interface PdfProject {
  name: string
  tech: string
  bullets: string[]
}

export interface ParsedResumeSections {
  name: string
  contact: string
  summary: string
  experience: PdfExperience[]
  skills: PdfSkillGroup[]
  education: PdfEducation[]
  certifications: PdfCertification[]
  projects: PdfProject[]
}

const SECTIONS: Record<string, keyof ParsedResumeSections> = {
  'PROFESSIONAL SUMMARY': 'summary',
  SUMMARY: 'summary',
  PROFILE: 'summary',
  OBJECTIVE: 'summary',
  'CAREER OBJECTIVE': 'summary',
  'WORK EXPERIENCE': 'experience',
  EXPERIENCE: 'experience',
  'PROFESSIONAL EXPERIENCE': 'experience',
  EMPLOYMENT: 'experience',
  'EMPLOYMENT HISTORY': 'experience',
  'CAREER HISTORY': 'experience',
  SKILLS: 'skills',
  'TECHNICAL SKILLS': 'skills',
  'CORE SKILLS': 'skills',
  'KEY SKILLS': 'skills',
  COMPETENCIES: 'skills',
  'CORE COMPETENCIES': 'skills',
  EDUCATION: 'education',
  'EDUCATIONAL BACKGROUND': 'education',
  'ACADEMIC BACKGROUND': 'education',
  QUALIFICATIONS: 'education',
  CERTIFICATIONS: 'certifications',
  CERTIFICATES: 'certifications',
  'LICENSES & CERTIFICATIONS': 'certifications',
  'PROFESSIONAL DEVELOPMENT': 'certifications',
  PROJECTS: 'projects',
  'KEY PROJECTS': 'projects',
  'NOTABLE PROJECTS': 'projects',
}

function detectSection(line: string): keyof ParsedResumeSections | null {
  const normalized = line
    .toUpperCase()
    .replace(/[:\-_]/g, '')
    .trim()
  return SECTIONS[normalized] || null
}

function isBullet(line: string): boolean {
  return /^[•\-·*▪▸►]/.test(line) || /^\d+[.)]\s/.test(line)
}

function cleanBullet(line: string): string {
  return line
    .replace(/^[•\-·*▪▸►]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .trim()
}

function isContact(line: string): boolean {
  return (
    line.includes('@') ||
    line.includes('|') ||
    /\+?\d[\d\s\-()]{8,}/.test(line) ||
    line.toLowerCase().includes('linkedin') ||
    line.toLowerCase().includes('github')
  )
}

export function parseResumeIntoSections(text: string): ParsedResumeSections {
  const result: ParsedResumeSections = {
    name: '',
    contact: '',
    summary: '',
    experience: [],
    skills: [],
    education: [],
    certifications: [],
    projects: [],
  }

  if (!text || text.trim().length < 10) {
    console.error('Empty resume text passed to parser')
    return result
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  console.log('=== PARSING RESUME, TOTAL LINES:', lines.length)

  let section: keyof ParsedResumeSections | null = null
  let currentJob: PdfExperience | null = null
  let currentProject: PdfProject | null = null
  let summaryLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const detected = detectSection(line)

    if (detected) {
      if (currentJob) {
        result.experience.push(currentJob)
        currentJob = null
      }
      if (currentProject) {
        result.projects.push(currentProject)
        currentProject = null
      }
      section = detected
      if (section === 'summary') summaryLines = []
      console.log('Section detected:', detected, '→', line)
      continue
    }

    if (!section) {
      if (!result.name && !isContact(line) && line.length > 1) {
        result.name = line.replace(/\*/g, '').replace(/_/g, '').trim()
        continue
      }
      if (isContact(line)) {
        result.contact = line.replace(/\*/g, '').trim()
        continue
      }
      continue
    }

    if (section === 'summary') {
      if (line.length > 5) {
        summaryLines.push(line)
        result.summary = summaryLines.join(' ')
      }
    }

    else if (section === 'experience') {
      if (isBullet(line)) {
        if (currentJob) currentJob.bullets.push(cleanBullet(line))
      } else {
        const hasDash = line.includes('—') || line.includes('–')
        const hasPipe = line.includes('|')
        const hasDate =
          /\b(19|20)\d{2}\b/.test(line) ||
          /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line) ||
          /present|current/i.test(line)

        if (hasDash || hasPipe || hasDate) {
          if (currentJob) result.experience.push({ ...currentJob })

          let title = line
          let company = ''
          let date = ''

          if (hasDash) {
            const parts = line.split(/[—–]/)
            title = parts[0]?.trim() || line
            const rest = parts[1] || ''
            if (rest.includes('|')) {
              const [comp, dt] = rest.split('|')
              company = comp?.trim() || ''
              date = dt?.trim() || ''
            } else {
              company = rest.trim()
            }
          } else if (hasPipe) {
            const parts = line.split('|')
            title = parts[0]?.trim() || line
            company = parts[1]?.trim() || ''
            date = parts[2]?.trim() || ''
          }

          currentJob = { title, company, date, location: '', bullets: [] }
          console.log('New job:', { title, company, date })
        } else if (currentJob) {
          if (!currentJob.company && line.length < 60) {
            currentJob.company = line
          } else if (
            !currentJob.location &&
            (line.includes(',') || line.length < 40) &&
            !hasDate
          ) {
            currentJob.location = line
          }
        } else {
          currentJob = { title: line, company: '', date: '', location: '', bullets: [] }
        }
      }
    }

    else if (section === 'skills') {
      if (line.includes(':')) {
        const colonIdx = line.indexOf(':')
        const category = line.substring(0, colonIdx).trim()
        const items = line
          .substring(colonIdx + 1)
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter(Boolean)
        if (items.length > 0) result.skills.push({ category, items })
      } else if (isBullet(line) || line.includes(',')) {
        const items = cleanBullet(line)
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter(Boolean)
        if (
          result.skills.length === 0 ||
          result.skills[result.skills.length - 1].category !== ''
        ) {
          result.skills.push({ category: '', items })
        } else {
          result.skills[result.skills.length - 1].items.push(...items)
        }
      } else {
        if (line.length > 1) result.skills.push({ category: '', items: [line] })
      }
    }

    else if (section === 'education') {
      if (!isBullet(line)) {
        const hasDash = line.includes('—') || line.includes('–')
        const hasPipe = line.includes('|')
        const hasYear = /\b(19|20)\d{2}\b/.test(line)

        if (hasDash || hasPipe) {
          const parts = line.split(/[—–|]/)
          result.education.push({
            degree: parts[0]?.trim() || line,
            institution: parts[1]?.trim() || '',
            year: parts[2]?.trim() || '',
            grade: '',
          })
        } else if (hasYear && result.education.length > 0) {
          result.education[result.education.length - 1].year =
            line.match(/\b(19|20)\d{2}\b/)?.[0] || line
        } else if (result.education.length > 0 && !result.education[result.education.length - 1].institution) {
          result.education[result.education.length - 1].institution = line
        } else {
          result.education.push({ degree: line, institution: '', year: '', grade: '' })
        }
      }
    }

    else if (section === 'certifications') {
      const cleaned = isBullet(line) ? cleanBullet(line) : line
      if (cleaned.includes('—') || cleaned.includes('–') || cleaned.includes('|')) {
        const parts = cleaned.split(/[|—–]/)
        result.certifications.push({
          name: parts[0]?.trim() || cleaned,
          issuer: parts[1]?.trim() || '',
          year: parts[2]?.trim() || '',
        })
      } else {
        if (cleaned.length > 1) {
          result.certifications.push({ name: cleaned, issuer: '', year: '' })
        }
      }
    }

    else if (section === 'projects') {
      if (isBullet(line)) {
        if (currentProject) currentProject.bullets.push(cleanBullet(line))
      } else if (line.toLowerCase().startsWith('tech') || line.toLowerCase().startsWith('technologies')) {
        if (currentProject) currentProject.tech = line.split(':')[1]?.trim() || ''
      } else {
        if (currentProject) result.projects.push(currentProject)
        currentProject = { name: line, tech: '', bullets: [] }
      }
    }
  }

  if (currentJob) result.experience.push(currentJob)
  if (currentProject) result.projects.push(currentProject)

  console.log('=== PARSED RESULT ===', JSON.stringify(result, null, 2))
  return result
}
