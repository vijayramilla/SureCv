import { ResumeDocument } from './ResumePDF'
import { resumeFormDataToPdfSections } from '../lib/resumeFormToPdfData'
import type { ResumeFormData } from '../types/resumeForm'

export type {
  ResumeFormData,
  BuilderExperience,
  BuilderEducation,
  BuilderCertification,
  BuilderProject,
} from '../types/resumeForm'

/** @deprecated Use ResumeDocument directly — kept for builder preview compatibility */
export function BuilderResumePDF({ data }: { data: ResumeFormData }) {
  return (
    <ResumeDocument
      resumeData={resumeFormDataToPdfSections(data)}
      candidateName={data.personalInfo.name}
    />
  )
}
