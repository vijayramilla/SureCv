import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import { getResumes } from './storage'
import type { ResumeFormData } from '../types/resumeForm'

export type SavedResumeSource = 'builder' | 'optimization'

export interface SavedResumeItem {
  id: string
  title: string
  subtitle: string
  resumeText: string
  source: SavedResumeSource
  savedAt: Date | null
}

export function formDataToResumeText(data: ResumeFormData): string {
  const lines: string[] = []
  const { personalInfo: p } = data

  if (p.name) lines.push(p.name)
  const contact = [p.email, p.phone, p.location, p.linkedin, p.portfolio]
    .filter(Boolean)
    .join(' | ')
  if (contact) lines.push(contact)
  if (lines.length) lines.push('')

  if (data.summary.trim()) {
    lines.push('PROFESSIONAL SUMMARY')
    lines.push(data.summary.trim())
    lines.push('')
  }

  if (data.experience.length > 0) {
    lines.push('EXPERIENCE')
    for (const job of data.experience) {
      const dates = `${job.startDate}${job.current ? ' - Present' : job.endDate ? ` - ${job.endDate}` : ''}`
      lines.push(`${job.title || 'Role'} — ${job.company || 'Company'}${job.location ? `, ${job.location}` : ''} (${dates})`)
      for (const bullet of job.bullets) {
        if (bullet.trim()) lines.push(`- ${bullet.trim()}`)
      }
      lines.push('')
    }
  }

  if (data.education.length > 0) {
    lines.push('EDUCATION')
    for (const edu of data.education) {
      lines.push(
        `${edu.degree || 'Degree'} — ${edu.school || 'Institution'}${edu.graduationDate ? ` (${edu.graduationDate})` : ''}${edu.gpa ? ` | GPA: ${edu.gpa}` : ''}`
      )
    }
    lines.push('')
  }

  if (data.skills.length > 0) {
    lines.push('SKILLS')
    lines.push(data.skills.join(', '))
    lines.push('')
  }

  if (data.certifications.length > 0) {
    lines.push('CERTIFICATIONS')
    for (const cert of data.certifications) {
      if (cert.name) {
        lines.push(`${cert.name}${cert.issuer ? ` — ${cert.issuer}` : ''}${cert.date ? ` (${cert.date})` : ''}`)
      }
    }
    lines.push('')
  }

  if (data.projects.length > 0) {
    lines.push('PROJECTS')
    for (const proj of data.projects) {
      if (proj.name) lines.push(proj.name)
      if (proj.description) lines.push(proj.description)
      if (proj.technologies?.length) lines.push(`Technologies: ${proj.technologies.join(', ')}`)
      if (proj.link) lines.push(proj.link)
      lines.push('')
    }
  }

  return lines.join('\n').trim()
}

function toDate(value: unknown): Date | null {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const maybe = value as { toDate?: () => Date }
    if (typeof maybe.toDate === 'function') return maybe.toDate()
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value)
    return Number.isNaN(d.getTime()) ? null : d
  }
  return null
}

function mapFirestoreDoc(id: string, data: Record<string, unknown>): SavedResumeItem | null {
  if (data.type === 'builder' && data.formData) {
    const formData = data.formData as ResumeFormData
    const name = formData.personalInfo?.name?.trim() || 'Resume Builder'
    const resumeText =
      (typeof data.resumeText === 'string' && data.resumeText) ||
      formDataToResumeText(formData)

    if (!resumeText.trim()) return null

    return {
      id,
      title: name,
      subtitle: 'From Resume Builder',
      resumeText,
      source: 'builder',
      savedAt: toDate(data.updatedAt) || toDate(data.createdAt),
    }
  }

  const resumeText =
    (typeof data.rewrittenResume === 'string' && data.rewrittenResume) ||
    (typeof data.originalResume === 'string' && data.originalResume) ||
    ''

  if (!resumeText.trim()) return null

  return {
    id,
    title: (typeof data.jobTitle === 'string' && data.jobTitle) || 'Optimized Resume',
    subtitle: (typeof data.companyName === 'string' && data.companyName) || 'Optimization history',
    resumeText,
    source: 'optimization',
    savedAt: toDate(data.createdAt) || toDate(data.updatedAt),
  }
}

function loadLocalBuilderResumes(userId: string): SavedResumeItem[] {
  const items: SavedResumeItem[] = []
  const prefix = `surecv_builder_${userId}_`

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (!key?.startsWith(prefix)) continue
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const formData = JSON.parse(raw) as ResumeFormData
      const resumeText = formDataToResumeText(formData)
      if (!resumeText.trim()) continue
      items.push({
        id: key,
        title: formData.personalInfo?.name?.trim() || 'Resume Builder (local)',
        subtitle: 'Saved on this device',
        resumeText,
        source: 'builder',
        savedAt: null,
      })
    } catch {
      // skip invalid entries
    }
  }

  return items
}

export async function fetchSavedResumes(userId: string, limit = 5): Promise<SavedResumeItem[]> {
  const byId = new Map<string, SavedResumeItem>()

  try {
    const snapshot = await getDocs(collection(db, 'users', userId, 'resumes'))
    for (const docSnap of snapshot.docs) {
      const item = mapFirestoreDoc(docSnap.id, docSnap.data() as Record<string, unknown>)
      if (item) byId.set(item.id, item)
    }
  } catch (error) {
    console.error('Error fetching saved resumes:', error)
  }

  for (const local of loadLocalBuilderResumes(userId)) {
    if (!byId.has(local.id)) byId.set(local.id, local)
  }

  for (const record of getResumes(userId)) {
    const resumeText = record.optimizedResume || record.originalResume
    if (!resumeText.trim()) continue
    const id = `local_opt_${record.id}`
    if (byId.has(id)) continue
    byId.set(id, {
      id,
      title: record.targetRole || 'Optimized Resume',
      subtitle: record.targetCompany || 'Local optimization',
      resumeText,
      source: 'optimization',
      savedAt: record.createdAt ? new Date(record.createdAt) : null,
    })
  }

  return Array.from(byId.values())
    .sort((a, b) => {
      const at = a.savedAt?.getTime() ?? 0
      const bt = b.savedAt?.getTime() ?? 0
      return bt - at
    })
    .slice(0, limit)
}
