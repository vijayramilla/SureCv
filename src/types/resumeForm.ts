export interface BuilderExperience {
  id: string
  title: string
  company: string
  location: string
  startDate: string
  endDate: string
  current: boolean
  bullets: string[]
}

export interface BuilderEducation {
  id: string
  degree: string
  school: string
  location: string
  graduationDate: string
  gpa?: string
}

export interface BuilderCertification {
  id: string
  name: string
  issuer: string
  date: string
  credentialId?: string
}

export interface BuilderProject {
  id: string
  name: string
  description: string
  link?: string
  technologies: string[]
}

export interface ResumeFormData {
  personalInfo: {
    name: string
    email: string
    phone: string
    location: string
    linkedin: string
    portfolio: string
  }
  summary: string
  experience: BuilderExperience[]
  education: BuilderEducation[]
  skills: string[]
  certifications: BuilderCertification[]
  projects: BuilderProject[]
}
