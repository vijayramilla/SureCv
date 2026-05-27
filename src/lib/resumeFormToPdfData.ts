import type { ResumeFormData } from '../types/resumeForm'
import type { ParsedResumeSections } from './parseResumeIntoSections'

export function resumeFormDataToPdfSections(data: ResumeFormData): ParsedResumeSections {
  const p = data.personalInfo
  const contact = [p.email, p.phone, p.location, p.linkedin, p.portfolio]
    .filter(Boolean)
    .join(' | ')

  return {
    name: p.name || 'Your Name',
    contact,
    summary: data.summary.trim(),
    experience: data.experience.map((job) => ({
      title: job.title || 'Role',
      company: job.company || '',
      date: `${job.startDate}${job.current ? ' - Present' : job.endDate ? ` - ${job.endDate}` : ''}`,
      location: job.location || '',
      bullets: job.bullets.filter(Boolean),
    })),
    skills: data.skills.length
      ? [{ category: '', items: data.skills }]
      : [],
    education: data.education.map((edu) => ({
      degree: edu.degree || '',
      institution: edu.school || '',
      year: edu.graduationDate || '',
      grade: edu.gpa ? `GPA: ${edu.gpa}` : '',
    })),
    certifications: data.certifications.map((c) => ({
      name: c.name || '',
      issuer: c.issuer || '',
      year: c.date || '',
    })),
    projects: data.projects.map((proj) => ({
      name: proj.name || '',
      tech: proj.technologies?.join(', ') || '',
      bullets: proj.description ? [proj.description] : [],
    })),
  }
}
