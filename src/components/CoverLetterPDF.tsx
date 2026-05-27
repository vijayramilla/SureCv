import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
} from '@react-pdf/renderer'
import { Download, Loader2 } from 'lucide-react'

const CL = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    paddingTop: 56,
    paddingBottom: 56,
    paddingLeft: 60,
    paddingRight: 60,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#1a1a1a',
    lineHeight: 1.65,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    backgroundColor: '#000000',
  },
  senderBlock: {
    marginBottom: 20,
    borderBottomWidth: 0.75,
    borderBottomColor: '#000000',
    paddingBottom: 12,
  },
  senderName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 20,
    color: '#000000',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  senderContact: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#555555',
    lineHeight: 1.5,
  },
  dateText: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#666666',
    marginBottom: 16,
  },
  recipientBlock: {
    marginBottom: 16,
  },
  recipientLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  recipientValue: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#333333',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#dddddd',
    marginBottom: 16,
  },
  greeting: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#000000',
    marginBottom: 14,
  },
  paragraph: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#222222',
    lineHeight: 1.7,
    marginBottom: 12,
    textAlign: 'justify',
  },
  highlightBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
    paddingLeft: 12,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 8,
    backgroundColor: '#f8f8f8',
    marginBottom: 12,
  },
  highlightText: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 10,
    color: '#333333',
    lineHeight: 1.6,
  },
  closingBlock: {
    marginTop: 20,
  },
  closingLine: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#333333',
    marginBottom: 24,
  },
  signatureName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: '#000000',
    letterSpacing: 0.5,
  },
  signatureTitle: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 60,
    right: 60,
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: '#aaaaaa',
  },
})

function getDate(): string {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function parseCoverLetter(text: string, resumeText?: string) {
  const resumeLines = (resumeText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
  const name = resumeLines[0] || ''
  const contact = resumeLines[1] || ''
  const paragraphs = (text || '')
    .split(/\n\n+/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter((p) => p.length > 20)
  return { name, contact, paragraphs }
}

export function CoverLetterDocument({
  coverLetterText,
  resumeText,
  jobTitle = 'the Position',
  companyName = '',
}: {
  coverLetterText: string
  resumeText?: string
  jobTitle?: string
  companyName?: string
}) {
  const { name, contact, paragraphs } = parseCoverLetter(coverLetterText, resumeText)
  const highlightIdx = paragraphs.length >= 3 ? 1 : -1

  return (
    <Document title={`${name} — Cover Letter`} author={name}>
      <Page size="A4" style={CL.page}>
        <View style={CL.topBar} fixed />

        <View style={CL.senderBlock}>
          <Text style={CL.senderName}>{name}</Text>
          {contact ? <Text style={CL.senderContact}>{contact}</Text> : null}
        </View>

        <Text style={CL.dateText}>{getDate()}</Text>

        <View style={CL.recipientBlock}>
          <Text style={CL.recipientLabel}>Applying For</Text>
          <Text style={CL.recipientValue}>{jobTitle}</Text>
          {companyName ? (
            <Text style={CL.recipientValue}>{companyName}</Text>
          ) : null}
        </View>

        <View style={CL.divider} />

        <Text style={CL.greeting}>Dear Hiring Manager,</Text>

        {paragraphs.map((para, i) =>
          i === highlightIdx ? (
            <View key={i} style={CL.highlightBox}>
              <Text style={CL.highlightText}>{para}</Text>
            </View>
          ) : (
            <Text key={i} style={CL.paragraph}>
              {para}
            </Text>
          )
        )}

        <View style={CL.closingBlock}>
          <Text style={CL.closingLine}>Sincerely,</Text>
          <Text style={CL.signatureName}>{name}</Text>
          {contact ? <Text style={CL.signatureTitle}>{contact}</Text> : null}
        </View>

        <View style={CL.footer} fixed>
          <Text style={CL.footerText}>Generated by SureCv.ai</Text>
          <Text style={CL.footerText}>Confidential</Text>
        </View>
      </Page>
    </Document>
  )
}

export function DownloadCoverLetterButton({
  coverLetterText,
  resumeText,
  jobTitle,
  companyName,
  candidateName,
  className,
}: {
  coverLetterText: string
  resumeText?: string
  jobTitle?: string
  companyName?: string
  candidateName?: string
  className?: string
}) {
  const btnClass =
    className ||
    'flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold py-2.5 rounded-xl border border-white/10 transition-all disabled:opacity-50 w-full'

  return (
    <PDFDownloadLink
      document={
        <CoverLetterDocument
          coverLetterText={coverLetterText}
          resumeText={resumeText}
          jobTitle={jobTitle || 'the Position'}
          companyName={companyName || ''}
        />
      }
      fileName={`${(candidateName || 'Cover-Letter').replace(/\s+/g, '-')}_Cover_Letter.pdf`}
    >
      {({ loading }) =>
        loading ? (
          <button type="button" disabled className={btnClass}>
            <Loader2 size={14} className="animate-spin" />
            Preparing…
          </button>
        ) : (
          <button type="button" className={btnClass}>
            <Download size={14} />
            Cover Letter PDF
          </button>
        )
      }
    </PDFDownloadLink>
  )
}

export default CoverLetterDocument
