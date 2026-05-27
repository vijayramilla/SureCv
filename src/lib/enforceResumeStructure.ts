import { parseResumeIntoSections } from './parseResumeIntoSections'

function cleanLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function enforceResumeStructure(
  rawResumeText: string,
  fallbackName = 'Candidate Name'
): string {
  const parsed = parseResumeIntoSections(rawResumeText || '')

  const name = cleanLine(parsed.name || fallbackName)
  const contact = cleanLine(parsed.contact || '')

  const lines: string[] = []
  lines.push(name)
  if (contact) lines.push(contact)
  lines.push('')

  lines.push('PROFESSIONAL SUMMARY')
  lines.push(cleanLine(parsed.summary || ''))
  lines.push('')

  lines.push('WORK EXPERIENCE')
  if (parsed.experience.length === 0) {
    lines.push('Role — Company | Dates')
    lines.push('City, State')
    lines.push('• Led key initiative improving outcomes by 20%')
  } else {
    parsed.experience.forEach((job) => {
      const headerLeft = cleanLine(job.title || 'Role')
      const company = cleanLine(job.company || 'Company')
      const date = cleanLine(job.date || 'Dates')
      lines.push(`${headerLeft} — ${company} | ${date}`)
      if (job.location) lines.push(cleanLine(job.location))
      if (job.bullets.length > 0) {
        job.bullets.forEach((b) => lines.push(`• ${cleanLine(b)}`))
      } else {
        lines.push('• Delivered measurable impact through ownership and execution')
      }
      lines.push('')
    })
  }

  lines.push('SKILLS')
  if (parsed.skills.length === 0) {
    lines.push('Core Skills: Communication, Leadership, Problem Solving')
  } else {
    parsed.skills.forEach((group) => {
      const label = cleanLine(group.category || 'Core Skills')
      const items = group.items.map(cleanLine).filter(Boolean).join(', ')
      if (items) lines.push(`${label}: ${items}`)
    })
  }
  lines.push('')

  lines.push('EDUCATION')
  if (parsed.education.length === 0) {
    lines.push('Degree — Institution | Year')
  } else {
    parsed.education.forEach((e) => {
      const degree = cleanLine(e.degree || 'Degree')
      const institution = cleanLine(e.institution || 'Institution')
      const year = cleanLine(e.year || '')
      lines.push(`${degree} — ${institution}${year ? ` | ${year}` : ''}`)
    })
  }
  lines.push('')

  lines.push('CERTIFICATIONS')
  if (parsed.certifications.length === 0) {
    lines.push('Certification Name — Issuer | Year')
  } else {
    parsed.certifications.forEach((c) => {
      const cert = cleanLine(c.name || 'Certification')
      const issuer = cleanLine(c.issuer || 'Issuer')
      const year = cleanLine(c.year || '')
      lines.push(`${cert} — ${issuer}${year ? ` | ${year}` : ''}`)
    })
  }

  return lines
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

