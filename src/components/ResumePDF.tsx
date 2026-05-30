import { 
  Document, Page, Text, View, StyleSheet, 
  PDFDownloadLink 
} from '@react-pdf/renderer'

// ─── STYLES ──────────────────────────────────────────
const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#111111',
    backgroundColor: '#FFFFFF',
    paddingTop: 40,
    paddingBottom: 50,
    paddingLeft: 45,
    paddingRight: 45,
    lineHeight: 1.4,
  },
  // HEADER
  name: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 22,
    color: '#000000',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  contact: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#444444',
    marginBottom: 10,
  },
  headerLine: {
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    marginBottom: 12,
  },
  // SECTION
  sectionWrap: {
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  sectionTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8.5,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    marginRight: 8,
  },
  sectionRule: {
    flex: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: '#000000',
  },
  // SUMMARY
  summaryText: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#222222',
    lineHeight: 1.55,
  },
  // JOB BLOCK
  jobWrap: {
    marginBottom: 9,
  },
  jobTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 1,
  },
  jobTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#000000',
    flex: 1,
  },
  jobDate: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#555555',
    flexShrink: 0,
    marginLeft: 8,
  },
  jobCompany: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 9,
    color: '#444444',
    marginBottom: 3,
  },
  // BULLETS
  bulletWrap: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 2,
  },
  bulletDot: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#000000',
    marginRight: 5,
    lineHeight: 1.5,
  },
  bulletVerb: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#000000',
  },
  bulletRest: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#222222',
    flex: 1,
    lineHeight: 1.5,
  },
  // SKILLS
  skillRow: {
    flexDirection: 'row',
    marginBottom: 2.5,
  },
  skillLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#000000',
    minWidth: 85,
    marginRight: 6,
  },
  skillItems: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    color: '#333333',
    flex: 1,
    lineHeight: 1.4,
  },
  // EDUCATION
  eduWrap: {
    marginBottom: 5,
  },
  eduTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eduDegree: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#000000',
    flex: 1,
  },
  eduYear: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#555555',
    flexShrink: 0,
  },
  eduInstitution: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 9,
    color: '#444444',
    marginTop: 1,
  },
  // CERTIFICATIONS
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  certName: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: '#000000',
    flex: 1,
  },
  certIssuer: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#555555',
    flex: 1,
    textAlign: 'center',
  },
  certYear: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#555555',
    flexShrink: 0,
  },
  // FOOTER
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 45,
    right: 45,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    borderTopColor: '#cccccc',
    paddingTop: 4,
  },
  footerText: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: '#aaaaaa',
  },
})

// ─── SECTION HEADER COMPONENT ────────────────────────
function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionRule} />
    </View>
  )
}

// ─── BULLET WITH BOLD VERB ───────────────────────────
function BulletLine({ text }: { text: string }) {
  if (!text || text.trim().length === 0) return null
  const clean = text.replace(/^[•\-·*]\s*/, '').trim()
  const words = clean.split(' ')
  const verb = words[0] || ''
  const rest = words.slice(1).join(' ')
  return (
    <View style={styles.bulletWrap}>
      <Text style={styles.bulletDot}>•</Text>
      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap' } as any}>
        <Text style={styles.bulletVerb}>{verb} </Text>
        <Text style={styles.bulletRest}>{rest}</Text>
      </View>
    </View>
  )
}

// ─── MAIN PARSER ─────────────────────────────────────
interface ResumeData {
  name: string
  contact: string
  summary: string
  experience: Array<{
    title: string
    company: string
    date: string
    location: string
    bullets: string[]
  }>
  skills: Array<{
    category: string
    items: string[]
  }>
  education: Array<{
    degree: string
    institution: string
    year: string
    grade: string
  }>
  certifications: Array<{
    name: string
    issuer: string
    year: string
  }>
}

function parseResume(rawText: string): ResumeData {
  // Split by actual newlines
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)

  console.log('TOTAL LINES:', lines.length)
  console.log('FIRST 5 LINES:', lines.slice(0, 5))

  const out: ResumeData = {
    name: '',
    contact: '',
    summary: '',
    experience: [],
    skills: [],
    education: [],
    certifications: [],
  }

  const SECTION_HEADERS: Record<string, string> = {
    'PROFESSIONAL SUMMARY': 'summary',
    'SUMMARY': 'summary',
    'OBJECTIVE': 'summary',
    'PROFESSIONAL PROFILE': 'summary',
    'PROFILE': 'summary',
    'WORK EXPERIENCE': 'experience',
    'EXPERIENCE': 'experience',
    'PROFESSIONAL EXPERIENCE': 'experience',
    'EMPLOYMENT HISTORY': 'experience',
    'EMPLOYMENT': 'experience',
    'CAREER HISTORY': 'experience',
    'SKILLS': 'skills',
    'TECHNICAL SKILLS': 'skills',
    'KEY SKILLS': 'skills',
    'CORE SKILLS': 'skills',
    'COMPETENCIES': 'skills',
    'CORE COMPETENCIES': 'skills',
    'EDUCATION': 'education',
    'EDUCATIONAL BACKGROUND': 'education',
    'QUALIFICATIONS': 'education',
    'CERTIFICATIONS': 'certifications',
    'CERTIFICATES': 'certifications',
    'LICENSES': 'certifications',
    'PROFESSIONAL DEVELOPMENT': 'certifications',
  }

  function detectSection(line: string): string | null {
    const u = line
      .toUpperCase()
      .replace(/[:\-_*#]/g, '')
      .trim()
    return SECTION_HEADERS[u] || null
  }

  function isBullet(line: string): boolean {
    return /^[•\-·*▪➤➢▸]/.test(line)
  }

  function isContact(line: string): boolean {
    return (
      line.includes('@') ||
      line.includes('|') ||
      /\+?\d[\d\s\-()]{7,}/.test(line) ||
      line.toLowerCase().includes('linkedin') ||
      line.toLowerCase().includes('github') ||
      line.toLowerCase().includes('portfolio')
    )
  }

  function hasDate(line: string): boolean {
    return (
      /\b(19|20)\d{2}\b/.test(line) ||
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|present|current)\b/i.test(line)
    )
  }

  let section: string | null = null
  let currentJob: any = null
  let summaryLines: string[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Check for section header
    const detected = detectSection(line)
    if (detected) {
      // Save open job
      if (currentJob && section === 'experience') {
        out.experience.push({ ...currentJob })
        currentJob = null
      }
      section = detected
      if (section === 'summary') summaryLines = []
      console.log('SECTION CHANGE →', detected, ':', line)
      continue
    }

    // HEADER BLOCK (before first section)
    if (!section) {
      if (!out.name && !isContact(line)) {
        out.name = line.replace(/[*_#]/g, '').trim()
        console.log('NAME:', out.name)
        continue
      }
      if (isContact(line) && !out.contact) {
        out.contact = line.replace(/[*_#]/g, '').trim()
        console.log('CONTACT:', out.contact)
        continue
      }
      continue
    }

    // ── SUMMARY ──
    if (section === 'summary') {
      if (line.length > 3) {
        summaryLines.push(line)
        out.summary = summaryLines.join(' ')
      }
      continue
    }

    // ── EXPERIENCE ──
    if (section === 'experience') {
      if (isBullet(line)) {
        if (currentJob) {
          currentJob.bullets.push(
            line.replace(/^[•\-·*▪]\s*/, '').trim()
          )
        }
        continue
      }

      // Detect new job line
      const hasDash = line.includes('—') || line.includes('–')
      const hasPipe = line.includes('|')

      if (hasDash || hasPipe || hasDate(line)) {
        if (currentJob) {
          out.experience.push({ ...currentJob })
        }

        let title = '', company = '', date = '', location = ''

        if (hasDash && hasPipe) {
          const dashParts = line.split(/[—–]/)
          title = dashParts[0].trim()
          const rest = dashParts[1] || ''
          const pipeParts = rest.split('|')
          company = pipeParts[0].trim()
          date = pipeParts[1]?.trim() || ''
        } else if (hasDash) {
          const p = line.split(/[—–]/)
          title = p[0].trim()
          company = p[1]?.trim() || ''
        } else if (hasPipe) {
          const p = line.split('|')
          title = p[0].trim()
          company = p[1]?.trim() || ''
          date = p[2]?.trim() || ''
        } else {
          title = line
        }

        currentJob = { title, company, date, location, bullets: [] }
        console.log('NEW JOB:', { title, company, date })
        continue
      }

      if (currentJob) {
        if (!currentJob.company && line.length < 60) {
          currentJob.company = line
        } else if (!currentJob.location && line.length < 50) {
          currentJob.location = line
        } else if (!currentJob.date && hasDate(line)) {
          currentJob.date = line
        }
      } else {
        currentJob = {
          title: line, company: '', date: '', location: '', bullets: []
        }
      }
      continue
    }

    // ── SKILLS ──
    if (section === 'skills') {
      if (line.includes(':')) {
        const idx = line.indexOf(':')
        const cat = line.substring(0, idx).trim()
        const vals = line.substring(idx + 1)
          .split(/[,;|]/)
          .map(s => s.trim())
          .filter(Boolean)
        if (vals.length > 0) {
          out.skills.push({ category: cat, items: vals })
        }
      } else {
        const items = line
          .split(/[,;|]/)
          .map(s => s.replace(/^[•\-·*]\s*/, '').trim())
          .filter(Boolean)
        if (
          out.skills.length === 0 ||
          out.skills[out.skills.length - 1].category !== ''
        ) {
          out.skills.push({ category: '', items })
        } else {
          out.skills[out.skills.length - 1].items.push(...items)
        }
      }
      continue
    }

    // ── EDUCATION ──
    if (section === 'education') {
      if (isBullet(line)) continue
      const hasDash = line.includes('—') || line.includes('–')
      const hasPipe = line.includes('|')

      if (hasDash || hasPipe) {
        const p = line.split(/[—–|]/)
        out.education.push({
          degree: p[0]?.trim() || line,
          institution: p[1]?.trim() || '',
          year: p[2]?.trim() || '',
          grade: '',
        })
      } else if (
        hasDate(line) &&
        out.education.length > 0 &&
        !out.education[out.education.length - 1].year
      ) {
        out.education[out.education.length - 1].year =
          line.match(/\b(19|20)\d{2}\b/)?.[0] || line
      } else if (
        out.education.length > 0 &&
        !out.education[out.education.length - 1].institution
      ) {
        out.education[out.education.length - 1].institution = line
      } else {
        out.education.push({
          degree: line, institution: '', year: '', grade: ''
        })
      }
      continue
    }

    // ── CERTIFICATIONS ──
    if (section === 'certifications') {
      const c = line.replace(/^[•\-·*]\s*/, '').trim()
      if (c.includes('—') || c.includes('–') || c.includes('|')) {
        const p = c.split(/[—–|]/)
        out.certifications.push({
          name: p[0]?.trim() || c,
          issuer: p[1]?.trim() || '',
          year: p[2]?.trim() || '',
        })
      } else if (c.length > 1) {
        out.certifications.push({ name: c, issuer: '', year: '' })
      }
      continue
    }
  }

  if (currentJob && section === 'experience') {
    out.experience.push(currentJob)
  }

  console.log('PARSED RESULT:', JSON.stringify(out, null, 2))
  return out
}

// ─── PDF DOCUMENT ────────────────────────────────────
export function ResumeDocument({ resumeText, resumeData }: { resumeText?: string; resumeData?: ResumeData }) {
  const d = resumeData || parseResume(resumeText || '')

  return (
    <Document
      title={`${d.name || 'Resume'} — SureCv`}
      author="SureCv.ai"
    >
      <Page size="A4" style={styles.page} wrap>

        {/* ══ HEADER ══ */}
        <View style={{ marginBottom: 0 }}>
          <Text style={styles.name}>
            {d.name || 'YOUR NAME'}
          </Text>
          {d.contact ? (
            <Text style={styles.contact}>{d.contact}</Text>
          ) : null}
          <View style={styles.headerLine} />
        </View>

        {/* ══ PROFESSIONAL SUMMARY ══ */}
        {d.summary && d.summary.length > 0 ? (
          <View style={styles.sectionWrap}>
            <SectionHeader title="Professional Summary" />
            <Text style={styles.summaryText}>{d.summary}</Text>
          </View>
        ) : null}

        {/* ══ WORK EXPERIENCE ══ */}
        {d.experience && d.experience.length > 0 ? (
          <View style={styles.sectionWrap}>
            <SectionHeader title="Work Experience" />
            {d.experience.map((job: any, i: number) => (
              <View key={i} style={styles.jobWrap} wrap={false}>
                <View style={styles.jobTopRow}>
                  <Text style={styles.jobTitle}>
                    {job.title}
                    {job.company ? ` — ${job.company}` : ''}
                  </Text>
                  {job.date ? (
                    <Text style={styles.jobDate}>{job.date}</Text>
                  ) : null}
                </View>
                {job.location ? (
                  <Text style={styles.jobCompany}>{job.location}</Text>
                ) : null}
                {job.bullets && job.bullets.length > 0
                  ? job.bullets.map((b: string, j: number) => (
                      <BulletLine key={j} text={b} />
                    ))
                  : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ══ SKILLS ══ */}
        {d.skills && d.skills.length > 0 ? (
          <View style={styles.sectionWrap}>
            <SectionHeader title="Skills" />
            {d.skills.map((g: any, i: number) => (
              <View key={i} style={styles.skillRow}>
                {g.category ? (
                  <Text style={styles.skillLabel}>{g.category}:</Text>
                ) : null}
                <Text style={styles.skillItems}>
                  {g.items.join(', ')}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* ══ EDUCATION ══ */}
        {d.education && d.education.length > 0 ? (
          <View style={styles.sectionWrap}>
            <SectionHeader title="Education" />
            {d.education.map((e: any, i: number) => (
              <View key={i} style={styles.eduWrap} wrap={false}>
                <View style={styles.eduTopRow}>
                  <Text style={styles.eduDegree}>{e.degree}</Text>
                  {e.year ? (
                    <Text style={styles.eduYear}>{e.year}</Text>
                  ) : null}
                </View>
                {e.institution ? (
                  <Text style={styles.eduInstitution}>
                    {e.institution}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ══ CERTIFICATIONS ══ */}
        {d.certifications && d.certifications.length > 0 ? (
          <View style={styles.sectionWrap}>
            <SectionHeader title="Certifications" />
            {d.certifications.map((c: any, i: number) => (
              <View key={i} style={styles.certRow} wrap={false}>
                <Text style={styles.certName}>{c.name}</Text>
                {c.issuer ? (
                  <Text style={styles.certIssuer}>{c.issuer}</Text>
                ) : null}
                {c.year ? (
                  <Text style={styles.certYear}>{c.year}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* ══ FOOTER ══ */}
        <View style={styles.footer} fixed>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }: any) =>
              totalPages > 1
                ? `Page ${pageNumber} of ${totalPages}`
                : ''
            }
          />
        </View>

      </Page>
    </Document>
  )
}

// ─── DOWNLOAD BUTTON ─────────────────────────────────
export function DownloadResumeButton({
  resumeText,
  resumeData,
  candidateName,
}: {
  resumeText?: string
  resumeData?: ResumeData
  candidateName?: string
}) {
  const firstName = (
    candidateName ||
    resumeData?.name ||
    resumeText?.split('\n').find((l: string) => l.trim().length > 1)?.trim() ||
    'Resume'
  ).replace(/\s+/g, '-')

  return (
    <PDFDownloadLink
      document={
        <ResumeDocument
          resumeText={resumeText}
          resumeData={resumeData}
        />
      }
      fileName={`SureCv-${firstName}.pdf`}
    >
      {({ loading }: { loading: boolean }) => (
        <button
          disabled={loading}
          className="flex items-center justify-center gap-2
            bg-[#7c3aed] hover:bg-[#6d28d9] text-white
            px-8 py-4 rounded-xl font-semibold transition-all
            hover:shadow-xl hover:shadow-purple-500/30
            disabled:opacity-60 disabled:cursor-wait"
        >
          {loading
            ? '⏳ Preparing PDF...'
            : '⬇ Download Premium Resume PDF'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
