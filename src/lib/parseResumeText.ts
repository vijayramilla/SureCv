export interface ParsedExperience {
  title: string
  company: string
  duration: string
  location: string
  bullets: string[]
}

export interface ParsedEducation {
  degree: string
  institution: string
  year: string
  grade: string
}

export interface ParsedProject {
  name: string
  description: string
  technologies: string[]
}

export interface ParsedResume {
  name: string
  title: string
  email: string
  phone: string
  location: string
  linkedin: string
  portfolio: string
  summary: string
  experience: ParsedExperience[]
  education: ParsedEducation[]
  skills: string[]
  certifications: string[]
  projects: ParsedProject[]
}

const SECTION_RE =
  /^(EXPERIENCE|WORK EXPERIENCE|PROFESSIONAL EXPERIENCE|EMPLOYMENT|EDUCATION|SKILLS|TECHNICAL SKILLS|CERTIFICATIONS|PROJECTS|SUMMARY|PROFESSIONAL SUMMARY|OBJECTIVE|AWARDS|ACHIEVEMENTS)\s*:?\s*$/i

const EMAIL_RE = /[\w.+-]+@[\w.-]+\.\w+/i
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/
const LINKEDIN_RE = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/[\w/-]+/i
const URL_RE = /https?:\/\/[^\s]+/i

function isSectionHeader(line: string): string | null {
  const t = line.trim()
  if (SECTION_RE.test(t)) return t.replace(/:$/, '').toUpperCase()
  if (
    t.length >= 4 &&
    t.length <= 50 &&
    /^[A-Z0-9\s/&\-–—.:]+$/.test(t) &&
    /[A-Z]{2,}/.test(t)
  ) {
    const upper = t.toUpperCase()
    if (
      upper.includes('EXPERIENCE') ||
      upper.includes('EDUCATION') ||
      upper.includes('SKILL') ||
      upper.includes('CERTIF') ||
      upper.includes('PROJECT') ||
      upper.includes('SUMMARY') ||
      upper.includes('OBJECTIVE')
    ) {
      return upper
    }
  }
  return null
}

function parseDurationLine(line: string): string {
  const m = line.match(
    /(\w{3,9}\s+\d{4}|\d{4})\s*[-–—]\s*(\w{3,9}\s+\d{4}|\d{4}|present|current)/i
  )
  return m ? m[0] : line.trim()
}

function splitSkillsBlock(text: string): string[] {
  return text
    .split(/[,|•\n;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1 && s.length < 40)
}

export function parseResumeText(text: string): ParsedResume {
  const result: ParsedResume = {
    name: '',
    title: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    portfolio: '',
    summary: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
  }

  if (!text?.trim()) return result

  const lines = text.split('\n').map((l) => l.trimEnd())
  let section = 'header'
  let summaryLines: string[] = []
  let skillLines: string[] = []
  let certLines: string[] = []
  let currentJob: ParsedExperience | null = null
  let currentEdu: ParsedEducation | null = null
  let currentProject: ParsedProject | null = null
  let headerLines: string[] = []

  const flushJob = () => {
    if (currentJob && (currentJob.title || currentJob.company || currentJob.bullets.length)) {
      result.experience.push(currentJob)
    }
    currentJob = null
  }

  const flushEdu = () => {
    if (currentEdu && (currentEdu.degree || currentEdu.institution)) {
      result.education.push(currentEdu)
    }
    currentEdu = null
  }

  const flushProject = () => {
    if (currentProject && currentProject.name) {
      result.projects.push(currentProject)
    }
    currentProject = null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const sec = isSectionHeader(line)
    if (sec) {
      flushJob()
      flushEdu()
      flushProject()
      if (section === 'summary') result.summary = summaryLines.join(' ').trim()
      if (section === 'skills') result.skills = splitSkillsBlock(skillLines.join(', '))
      if (section === 'certifications') {
        result.certifications = certLines.filter(Boolean)
      }
      summaryLines = []
      skillLines = []
      certLines = []

      if (sec.includes('EXPERIENCE') || sec.includes('EMPLOYMENT')) section = 'experience'
      else if (sec.includes('EDUCATION')) section = 'education'
      else if (sec.includes('SKILL')) section = 'skills'
      else if (sec.includes('CERTIF')) section = 'certifications'
      else if (sec.includes('PROJECT')) section = 'projects'
      else if (sec.includes('SUMMARY') || sec.includes('OBJECTIVE')) section = 'summary'
      else section = 'other'
      continue
    }

    if (section === 'header' || (i < 8 && !result.name)) {
      if (!result.email && EMAIL_RE.test(line)) {
        result.email = line.match(EMAIL_RE)?.[0] || ''
        continue
      }
      if (!result.phone && PHONE_RE.test(line)) {
        result.phone = line.match(PHONE_RE)?.[0]?.trim() || ''
        continue
      }
      if (!result.linkedin && LINKEDIN_RE.test(line)) {
        result.linkedin = line.match(LINKEDIN_RE)?.[0] || line
        continue
      }
      if (!result.portfolio && URL_RE.test(line) && !LINKEDIN_RE.test(line)) {
        result.portfolio = line.match(URL_RE)?.[0] || line
        continue
      }
      if (
        !result.location &&
        /[A-Za-z]+,\s*[A-Z]{2}/.test(line) &&
        line.length < 60
      ) {
        result.location = line
        continue
      }
      headerLines.push(line)
      continue
    }

    if (section === 'summary') {
      summaryLines.push(line)
      continue
    }

    if (section === 'skills') {
      skillLines.push(line)
      continue
    }

    if (section === 'certifications') {
      certLines.push(line.replace(/^[-•]\s*/, ''))
      continue
    }

    if (section === 'experience') {
      if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
        if (!currentJob) currentJob = { title: '', company: '', duration: '', location: '', bullets: [] }
        currentJob.bullets.push(line.replace(/^[-•*]\s*/, ''))
        continue
      }
      const hasDate = /\d{4}|present|current/i.test(line)
      if (!currentJob || (currentJob.bullets.length > 0 && hasDate)) {
        flushJob()
        currentJob = { title: '', company: '', duration: '', location: '', bullets: [] }
      }
      if (!currentJob) currentJob = { title: '', company: '', duration: '', location: '', bullets: [] }

      if (hasDate && !currentJob.duration) {
        currentJob.duration = parseDurationLine(line)
      } else if (!currentJob.title) {
        const parts = line.split(/\s+[|@]\s+|\s+[-–—]\s+/)
        currentJob.title = parts[0] || line
        if (parts[1]) currentJob.company = parts[1]
      } else if (!currentJob.company) {
        currentJob.company = line
      } else {
        currentJob.bullets.push(line)
      }
      continue
    }

    if (section === 'education') {
      if (!currentEdu) currentEdu = { degree: '', institution: '', year: '', grade: '' }
      if (/\d{4}/.test(line) && !currentEdu.year) {
        currentEdu.year = line.match(/\d{4}/)?.[0] || line
      } else if (!currentEdu.degree) {
        currentEdu.degree = line
      } else if (!currentEdu.institution) {
        currentEdu.institution = line
      }
      continue
    }

    if (section === 'projects') {
      if (!currentProject) {
        currentProject = { name: line, description: '', technologies: [] }
      } else if (line.startsWith('-') || line.startsWith('•')) {
        currentProject.description += (currentProject.description ? ' ' : '') + line.replace(/^[-•]\s*/, '')
      } else {
        flushProject()
        currentProject = { name: line, description: '', technologies: [] }
      }
    }
  }

  flushJob()
  flushEdu()
  flushProject()
  if (section === 'summary') result.summary = summaryLines.join(' ').trim()
  if (section === 'skills') result.skills = splitSkillsBlock(skillLines.join(', '))
  if (section === 'certifications') result.certifications = certLines.filter(Boolean)

  if (headerLines.length > 0) {
    result.name = headerLines[0] || 'Professional'
    if (headerLines.length > 1 && !EMAIL_RE.test(headerLines[1]) && !PHONE_RE.test(headerLines[1])) {
      const second = headerLines[1]
      if (second.length < 60 && !second.includes('@')) {
        result.title = second
      }
    }
  }

  if (!result.name) result.name = 'Professional'
  if (!result.summary && headerLines.length > 2) {
    result.summary = headerLines.slice(2).join(' ').slice(0, 500)
  }

  return result
}
