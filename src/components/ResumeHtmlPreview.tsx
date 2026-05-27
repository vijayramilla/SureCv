import type { ResumeFormData } from '../types/resumeForm'
import { ZoomablePreviewPane } from './ZoomablePreviewPane'

const A4_WIDTH = 595

/** Instant HTML preview with +/- zoom and scroll — no PDF blink. */
export function ResumeHtmlPreview({ data }: { data: ResumeFormData }) {
  const p = data.personalInfo

  return (
    <ZoomablePreviewPane baseWidth={A4_WIDTH} className="h-full">
      <div
        className="bg-white text-black shadow-2xl"
        style={{
          width: A4_WIDTH,
          minHeight: 842,
          padding: '28px 32px',
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontSize: 10,
          lineHeight: 1.45,
          color: '#111111',
        }}
      >
        <header className="text-center border-b-2 border-black pb-2 mb-3">
          <h1
            className="font-bold text-black m-0 mb-1"
            style={{ fontSize: 22, letterSpacing: '0.5px' }}
          >
            {p.name || 'Your Name'}
          </h1>
          <p className="text-[#444] m-0" style={{ fontSize: 9 }}>
            {[p.email, p.phone, p.location].filter(Boolean).join(' | ') ||
              'email@example.com | phone | location'}
          </p>
          {(p.linkedin || p.portfolio) && (
            <p className="text-[#444] m-0 mt-0.5" style={{ fontSize: 9 }}>
              {[p.linkedin, p.portfolio].filter(Boolean).join(' | ')}
            </p>
          )}
        </header>

        {data.summary.trim() ? (
          <section className="mb-3">
            <h2
              className="font-bold uppercase text-black border-b border-black pb-0.5 mb-1"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              Professional Summary
            </h2>
            <p className="text-[#222] m-0" style={{ fontSize: 9.5 }}>
              {data.summary}
            </p>
          </section>
        ) : null}

        {data.experience.length > 0 ? (
          <section className="mb-3">
            <h2
              className="font-bold uppercase text-black border-b border-black pb-0.5 mb-1.5"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              Work Experience
            </h2>
            {data.experience.map((job) => (
              <div key={job.id} className="mb-2">
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-black" style={{ fontSize: 10 }}>
                    {job.title || 'Job Title'}
                  </span>
                  <span className="text-[#666] shrink-0" style={{ fontSize: 9 }}>
                    {job.startDate}
                    {job.current
                      ? ' - Present'
                      : job.endDate
                        ? ` - ${job.endDate}`
                        : ''}
                  </span>
                </div>
                <p className="text-[#444] m-0 mb-0.5" style={{ fontSize: 9.5 }}>
                  {job.company || 'Company'}
                  {job.location ? `, ${job.location}` : ''}
                </p>
                {job.bullets.filter(Boolean).map((b, i) => (
                  <p key={i} className="text-[#222] m-0 pl-2" style={{ fontSize: 9 }}>
                    • {b}
                  </p>
                ))}
              </div>
            ))}
          </section>
        ) : null}

        {data.education.length > 0 ? (
          <section className="mb-3">
            <h2
              className="font-bold uppercase text-black border-b border-black pb-0.5 mb-1.5"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              Education
            </h2>
            {data.education.map((edu) => (
              <div key={edu.id} className="mb-1.5">
                <div className="flex justify-between gap-2">
                  <span className="font-bold text-black" style={{ fontSize: 10 }}>
                    {edu.degree || 'Degree'}
                  </span>
                  <span className="text-[#666]" style={{ fontSize: 9 }}>
                    {edu.graduationDate}
                  </span>
                </div>
                <p className="text-[#444] m-0" style={{ fontSize: 9 }}>
                  {edu.school}
                  {edu.location ? `, ${edu.location}` : ''}
                  {edu.gpa ? ` | GPA: ${edu.gpa}` : ''}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {data.skills.length > 0 ? (
          <section className="mb-3">
            <h2
              className="font-bold uppercase text-black border-b border-black pb-0.5 mb-1.5"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              Skills
            </h2>
            <p className="text-[#222] m-0" style={{ fontSize: 9 }}>
              {data.skills.join(' • ')}
            </p>
          </section>
        ) : null}

        {data.certifications.length > 0 ? (
          <section className="mb-3">
            <h2
              className="font-bold uppercase text-black border-b border-black pb-0.5 mb-1.5"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              Certifications
            </h2>
            {data.certifications.map((c) => (
              <p key={c.id} className="text-[#222] m-0 mb-0.5" style={{ fontSize: 9.5 }}>
                <strong>{c.name}</strong>
                {c.issuer ? ` — ${c.issuer}` : ''}
                {c.date ? ` (${c.date})` : ''}
              </p>
            ))}
          </section>
        ) : null}

        {data.projects.length > 0 ? (
          <section>
            <h2
              className="font-bold uppercase text-black border-b border-black pb-0.5 mb-1.5"
              style={{ fontSize: 11, letterSpacing: '0.08em' }}
            >
              Projects
            </h2>
            {data.projects.map((proj) => (
              <div key={proj.id} className="mb-1.5">
                <p className="font-bold text-black m-0" style={{ fontSize: 10 }}>
                  {proj.name}
                </p>
                {proj.description ? (
                  <p className="text-[#222] m-0" style={{ fontSize: 9 }}>
                    {proj.description}
                  </p>
                ) : null}
                {proj.link ? (
                  <p className="text-[#333] m-0 underline" style={{ fontSize: 8 }}>
                    {proj.link}
                  </p>
                ) : null}
              </div>
            ))}
          </section>
        ) : null}
      </div>
    </ZoomablePreviewPane>
  )
}
