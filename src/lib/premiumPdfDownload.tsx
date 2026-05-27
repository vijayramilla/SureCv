import { pdf } from '@react-pdf/renderer'
import { ResumeDocument } from '../components/ResumePDF'
import { CoverLetterDocument } from '../components/CoverLetterPDF'
import type { ResumeFormData } from '../types/resumeForm'

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function downloadPremiumResumePdf(options: {
  resumeText?: string
  resumeData?: ResumeFormData
  candidateName?: string
}): Promise<void> {
  const name =
    options.candidateName ||
    options.resumeData?.personalInfo?.name ||
    options.resumeText?.split('\n')[0]?.trim() ||
    'Resume'

  const blob = await pdf(
    <ResumeDocument
      resumeText={options.resumeText}
      resumeData={options.resumeData}
      candidateName={name}
    />
  ).toBlob()

  triggerBlobDownload(blob, `${name.replace(/\s+/g, '-')}_Resume.pdf`)
}

export async function downloadPremiumCoverLetterPdf(options: {
  coverLetterText: string
  resumeText?: string
  jobTitle?: string
  companyName?: string
  candidateName?: string
}): Promise<void> {
  const name = options.candidateName || 'Cover-Letter'
  const blob = await pdf(
    <CoverLetterDocument
      coverLetterText={options.coverLetterText}
      resumeText={options.resumeText}
      jobTitle={options.jobTitle}
      companyName={options.companyName}
    />
  ).toBlob()

  triggerBlobDownload(blob, `${name.replace(/\s+/g, '-')}_Cover_Letter.pdf`)
}
