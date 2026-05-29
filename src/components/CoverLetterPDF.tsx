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
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#1a1a1a',
    paddingTop: 0,
    paddingBottom: 50,
    paddingLeft: 0,
    paddingRight: 0,
    lineHeight: 1.65,
  },

  // BLACK TOP BAR — premium letterhead
  topAccentBar: {
    backgroundColor: '#000000',
    height: 8,
    width: '100%',
    marginBottom: 0,
  },

  // PURPLE SECONDARY BAR
  secondaryBar: {
    backgroundColor: '#7c3aed',
    height: 3,
    width: '100%',
    marginBottom: 28,
  },

  // CONTENT WRAPPER
  content: {
    paddingLeft: 56,
    paddingRight: 56,
  },

  // SENDER HEADER BLOCK
  senderBlock: {
    marginBottom: 6,
  },
  senderName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
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

  // DIVIDER UNDER HEADER
  headerDivider: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    marginTop: 10,
    marginBottom: 18,
  },

  // META ROW — date left, applying for right
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  dateText: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#666666',
  },
  applyingBlock: {
    alignItems: 'flex-end',
  },
  applyingLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#7c3aed',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  applyingValue: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#222222',
    textAlign: 'right',
  },

  // THIN SEPARATOR
  thinLine: {
    borderBottomWidth: 0.5,
    borderBottomColor: '#dddddd',
    marginBottom: 18,
  },

  // GREETING
  greeting: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: '#000000',
    marginBottom: 14,
  },

  // PARAGRAPH
  paragraph: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#222222',
    lineHeight: 1.72,
    marginBottom: 13,
    textAlign: 'justify',
  },

  // ACHIEVEMENT HIGHLIGHT BOX
  // Used for paragraph 2 (the proof paragraph)
  highlightBox: {
    borderLeftWidth: 3,
    borderLeftColor: '#000000',
    paddingLeft: 14,
    paddingTop: 10,
    paddingBottom: 10,
    paddingRight: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 13,
  },
  highlightText: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#222222',
    lineHeight: 1.68,
  },

  // CLOSING BLOCK
  closingBlock: {
    marginTop: 18,
  },
  closingLine: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: '#333333',
    marginBottom: 26,
  },
  signatureName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 13,
    color: '#000000',
    letterSpacing: 0.5,
  },
  signatureTitle: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#666666',
    marginTop: 3,
  },
  signatureContact: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },

  // BOTTOM ACCENT
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: '#000000',
  },

  // PAGE NUMBER
  pageNum: {
    position: 'absolute',
    bottom: 20,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  pageNumText: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: '#cccccc',
  },
})

function getFormattedDate() {
  return new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function parseMeta(resumeText: string) {
  const lines = (resumeText || '')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
  
  const name = lines[0]?.replace(/[*_#]/g, '').trim() || ''
  
  const contactLine = lines.find(l =>
    l.includes('@') || l.includes('|') ||
    /\+?\d[\d\s\-()]{7,}/.test(l)
  ) || ''

  return { name, contact: contactLine }
}

function splitIntoParagraphs(text: string) {
  if (!text) return []
  return text
    .split(/\n\n+/)
    .map(p => p.replace(/\n/g, ' ').trim())
    .filter(p => p.length > 15)
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
  const { name, contact } = parseMeta(resumeText || '')
  const paragraphs = splitIntoParagraphs(coverLetterText)

  // Paragraph 2 gets the highlight box treatment
  // (it contains the achievements/metrics)
  const highlightParagraphIndex = 1

  return (
    <Document
      title={`${name} — Cover Letter`}
      author="SureCv.ai"
    >
      <Page size="A4" style={CL.page}>

        {/* BLACK TOP BAR */}
        <View style={CL.topAccentBar} fixed />
        
        {/* PURPLE ACCENT */}
        <View style={CL.secondaryBar} fixed />

        {/* MAIN CONTENT */}
        <View style={CL.content}>

          {/* SENDER HEADER */}
          <View style={CL.senderBlock}>
            <Text style={CL.senderName}>{name}</Text>
            {contact ? (
              <Text style={CL.senderContact}>{contact}</Text>
            ) : null}
          </View>

          {/* HEADER DIVIDER */}
          <View style={CL.headerDivider} />

          {/* META ROW */}
          <View style={CL.metaRow}>
            <Text style={CL.dateText}>{getFormattedDate()}</Text>
            <View style={CL.applyingBlock}>
              <Text style={CL.applyingLabel}>Applying For</Text>
              <Text style={CL.applyingValue}>
                {jobTitle}
              </Text>
              {companyName ? (
                <Text style={CL.applyingValue}>
                  {companyName}
                </Text>
              ) : null}
            </View>
          </View>

          {/* THIN LINE */}
          <View style={CL.thinLine} />

          {/* GREETING */}
          <Text style={CL.greeting}>Dear Hiring Manager,</Text>

          {/* PARAGRAPHS */}
          {paragraphs.map((para, i) => (
            i === highlightParagraphIndex ? (
              <View key={i} style={CL.highlightBox}>
                <Text style={CL.highlightText}>{para}</Text>
              </View>
            ) : (
              <Text key={i} style={CL.paragraph}>{para}</Text>
            )
          ))}

          {/* CLOSING */}
          <View style={CL.closingBlock}>
            <Text style={CL.closingLine}>
              Sincerely,
            </Text>
            <Text style={CL.signatureName}>{name}</Text>
            {contact ? (
              <Text style={CL.signatureContact}>
                {contact}
              </Text>
            ) : null}
          </View>

        </View>

        {/* BOTTOM BLACK BAR */}
        <View style={CL.bottomAccent} fixed />

      </Page>
    </Document>
  )
}

export function DownloadCoverLetterButton({
  coverLetterText,
  resumeText,
  jobTitle,
  companyName,
}: {
  coverLetterText: string
  resumeText?: string
  jobTitle?: string
  companyName?: string
}) {
  const name = resumeText
    ?.split('\n')
    .find(l => l.trim().length > 1)
    ?.trim() || 'Candidate'

  return (
    <PDFDownloadLink
      document={
        <CoverLetterDocument
          coverLetterText={coverLetterText}
          resumeText={resumeText}
          jobTitle={jobTitle || 'Position'}
          companyName={companyName || ''}
        />
      }
      fileName={`SureCv-CoverLetter-${name.replace(/\s+/g, '-')}.pdf`}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center justify-center gap-2
            border border-white/20 hover:border-purple-400/50
            text-white px-8 py-4 rounded-xl font-semibold
            transition-all hover:bg-white/5 disabled:opacity-60"
        >
          {loading
            ? '⏳ Preparing...'
            : '📄 Download Cover Letter PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}

export default CoverLetterDocument
